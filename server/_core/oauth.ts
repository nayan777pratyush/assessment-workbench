import { ONE_YEAR_MS } from "@shared/const";
import axios from "axios";
import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { setSessionCookie, signSession } from "./auth";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

const GITHUB_STATE_COOKIE = "assessment_github_oauth_state";
const OIDC_STATE_COOKIE = "assessment_oidc_oauth_state";

function origin(req: Request) {
  if (ENV.appUrl) return ENV.appUrl;
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0];
  const protocol = forwardedProto || req.protocol;
  const host = String(req.headers["x-forwarded-host"] ?? req.get("host") ?? "").split(",")[0];
  return `${protocol}://${host}`;
}

function secureCookie(req: Request) {
  return req.secure || String(req.headers["x-forwarded-proto"] ?? "").split(",").some(value => value.trim() === "https");
}

function setState(res: Response, req: Request, name: string, state: string) {
  res.cookie(name, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(req),
    maxAge: 10 * 60 * 1000,
    path: "/",
  });
}

function clearState(res: Response, req: Request, name: string) {
  res.clearCookie(name, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(req),
    path: "/",
  });
}

function readCookie(req: Request, name: string) {
  const raw = req.headers.cookie ?? "";
  const match = raw.split(";").map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function getQuery(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function redirectAuthError(res: Response, message: string) {
  res.redirect(302, `/?auth_error=${encodeURIComponent(message)}`);
}

async function createCandidateSession(
  req: Request,
  res: Response,
  provider: string,
  providerAccountId: string,
  name: string,
  email: string | null,
  emailVerified = false,
) {
  const user = await db.findOrCreateUserForProvider({
    provider,
    providerAccountId,
    name: name || null,
    email,
    emailVerified,
  });
  const token = await signSession(user.id, user.name || user.email || "User", { expiresInMs: ONE_YEAR_MS });
  setSessionCookie(req, res, token);
  res.redirect(302, "/");
}

async function providerDiscovery(issuer: string) {
  const base = issuer.replace(/\/$/, "");
  const { data } = await axios.get(`${base}/.well-known/openid-configuration`, { timeout: 10_000 });
  if (!data.authorization_endpoint || !data.token_endpoint || !data.userinfo_endpoint) {
    throw new Error("OIDC discovery is incomplete");
  }
  return data as { authorization_endpoint: string; token_endpoint: string; userinfo_endpoint: string };
}

async function startOidcProvider(
  req: Request,
  res: Response,
  provider: "google" | "microsoft",
  issuer: string,
  clientId: string,
) {
  if (!clientId) {
    res.status(503).json({ error: `${provider} OAuth is not configured.` });
    return;
  }
  const discovery = await providerDiscovery(issuer);
  const state = crypto.randomBytes(32).toString("hex");
  const cookieName = `assessment_${provider}_oauth_state`;
  setState(res, req, cookieName, state);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin(req)}/api/auth/${provider}/callback`,
    response_type: "code",
    scope: "openid profile email",
    state,
  });
  res.redirect(302, `${discovery.authorization_endpoint}?${params.toString()}`);
}

async function finishOidcProvider(
  req: Request,
  res: Response,
  provider: "google" | "microsoft",
  issuer: string,
  clientId: string,
  clientSecret: string,
) {
  const code = getQuery(req, "code");
  const state = getQuery(req, "state");
  const cookieName = `assessment_${provider}_oauth_state`;
  if (!code || !state || state !== readCookie(req, cookieName)) {
    res.status(403).json({ error: `Invalid ${provider} OAuth state` });
    return;
  }
  clearState(res, req, cookieName);

  const discovery = await providerDiscovery(issuer);
  const redirectUri = `${origin(req)}/api/auth/${provider}/callback`;
  const tokenResponse = await axios.post(
    discovery.token_endpoint,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10_000 },
  );

  const accessToken = tokenResponse.data?.access_token;
  if (!accessToken) throw new Error(`${provider} access token missing`);

  const profile = await axios.get(discovery.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 10_000,
  });

  const subject = String(profile.data?.sub ?? "");
  const email = typeof profile.data?.email === "string" ? profile.data.email.toLowerCase() : null;
  const emailVerified = profile.data?.email_verified === true || provider === "microsoft";
  if (!subject || !email) throw new Error(`${provider} profile missing subject or email`);

  await createCandidateSession(
    req,
    res,
    provider,
    subject,
    profile.data?.name || profile.data?.preferred_username || email,
    email,
    emailVerified,
  );
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/providers", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      oidc: Boolean(ENV.oidcIssuerUrl && ENV.oidcClientId && ENV.oidcClientSecret),
      github: Boolean(ENV.githubClientId && ENV.githubClientSecret),
      google: Boolean(ENV.googleClientId && ENV.googleClientSecret),
      microsoft: Boolean(ENV.microsoftClientId && ENV.microsoftClientSecret),
      email: Boolean(ENV.emailApiKey),
    });
  });

  app.get("/api/auth/github/start", (req, res) => {
    if (!ENV.githubClientId || !ENV.githubClientSecret) {
      res.status(503).json({ error: "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET." });
      return;
    }
    const state = crypto.randomBytes(32).toString("hex");
    setState(res, req, GITHUB_STATE_COOKIE, state);
    const redirectUri = `${origin(req)}/api/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: ENV.githubClientId,
      redirect_uri: redirectUri,
      scope: "read:user user:email",
      state,
    });
    res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const code = getQuery(req, "code");
    const state = getQuery(req, "state");
    if (!code || !state || state !== readCookie(req, GITHUB_STATE_COOKIE)) {
      res.status(403).json({ error: "Invalid GitHub OAuth state" });
      return;
    }
    clearState(res, req, GITHUB_STATE_COOKIE);
    try {
      const redirectUri = `${origin(req)}/api/auth/github/callback`;
      const tokenResponse = await axios.post(
        "https://github.com/login/oauth/access_token",
        { client_id: ENV.githubClientId, client_secret: ENV.githubClientSecret, code, redirect_uri: redirectUri },
        { headers: { Accept: "application/json" }, timeout: 10_000 },
      );
      const accessToken = tokenResponse.data?.access_token;
      if (!accessToken) throw new Error("GitHub access token missing");
      const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" };
      const profile = await axios.get("https://api.github.com/user", { headers, timeout: 10_000 });
      const emails = await axios.get("https://api.github.com/user/emails", { headers, timeout: 10_000 });
      const verified = Array.isArray(emails.data)
        ? emails.data.find((entry: any) => entry.verified && entry.primary) ?? emails.data.find((entry: any) => entry.verified)
        : null;
      await createCandidateSession(
        req,
        res,
        "github",
        String(profile.data.id),
        profile.data.name || profile.data.login,
        verified?.email ?? profile.data.email ?? null,
        Boolean(verified?.verified),
      );
    } catch (error) {
      console.error("[OAuth] GitHub callback failed", error);
      redirectAuthError(res, "GitHub sign-in failed. Please try again.");
    }
  });

  app.get("/api/auth/oidc/start", async (req, res) => {
    if (!ENV.oidcIssuerUrl || !ENV.oidcClientId || !ENV.oidcClientSecret) {
      res.status(503).json({ error: "Institution SSO is not configured. Set OIDC_ISSUER_URL, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET." });
      return;
    }
    try {
      const discovery = await providerDiscovery(ENV.oidcIssuerUrl);
      const state = crypto.randomBytes(32).toString("hex");
      setState(res, req, OIDC_STATE_COOKIE, state);
      const params = new URLSearchParams({
        client_id: ENV.oidcClientId,
        redirect_uri: `${origin(req)}/api/auth/oidc/callback`,
        response_type: "code",
        scope: "openid profile email",
        state,
      });
      res.redirect(302, `${discovery.authorization_endpoint}?${params.toString()}`);
    } catch (error) {
      console.error("[OAuth] Institution OIDC start failed", error);
      res.status(502).json({ error: "Institution SSO discovery failed" });
    }
  });

  app.get("/api/auth/oidc/callback", async (req, res) => {
    const code = getQuery(req, "code");
    const state = getQuery(req, "state");
    if (!code || !state || state !== readCookie(req, OIDC_STATE_COOKIE)) {
      res.status(403).json({ error: "Invalid institution SSO state" });
      return;
    }
    clearState(res, req, OIDC_STATE_COOKIE);
    try {
      const discovery = await providerDiscovery(ENV.oidcIssuerUrl);
      const redirectUri = `${origin(req)}/api/auth/oidc/callback`;
      const tokenResponse = await axios.post(
        discovery.token_endpoint,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: ENV.oidcClientId,
          client_secret: ENV.oidcClientSecret,
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10_000 },
      );
      const accessToken = tokenResponse.data?.access_token;
      if (!accessToken) throw new Error("OIDC access token missing");
      const userInfo = await axios.get(discovery.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10_000,
      });
      const subject = String(userInfo.data?.sub ?? "");
      const email = typeof userInfo.data?.email === "string" ? userInfo.data.email.toLowerCase() : null;
      const emailVerified = userInfo.data?.email_verified === true;
      if (!subject || !email) throw new Error("OIDC subject or email missing");
      if (ENV.oidcAllowedDomains.length && !ENV.oidcAllowedDomains.some(domain => email.endsWith(`@${domain}`))) {
        res.status(403).json({ error: "This institution account is not allowed for the assessment." });
        return;
      }
      await createCandidateSession(req, res, "oidc", subject, userInfo.data?.name || userInfo.data?.preferred_username || email, email, emailVerified);
    } catch (error) {
      console.error("[OAuth] Institution OIDC callback failed", error);
      redirectAuthError(res, "Institution SSO sign-in failed. Please try again.");
    }
  });

  app.get("/api/auth/google/start", async (req, res) => {
    try {
      await startOidcProvider(req, res, "google", ENV.googleIssuerUrl, ENV.googleClientId);
    } catch (error) {
      console.error("[OAuth] Google start failed", error);
      res.status(502).json({ error: "Google OAuth discovery failed" });
    }
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      await finishOidcProvider(req, res, "google", ENV.googleIssuerUrl, ENV.googleClientId, ENV.googleClientSecret);
    } catch (error) {
      console.error("[OAuth] Google callback failed", error);
      redirectAuthError(res, "Google sign-in failed. Please try again.");
    }
  });

  app.get("/api/auth/microsoft/start", async (req, res) => {
    try {
      await startOidcProvider(req, res, "microsoft", ENV.microsoftIssuerUrl, ENV.microsoftClientId);
    } catch (error) {
      console.error("[OAuth] Microsoft start failed", error);
      res.status(502).json({ error: "Microsoft OAuth discovery failed" });
    }
  });

  app.get("/api/auth/microsoft/callback", async (req, res) => {
    try {
      await finishOidcProvider(req, res, "microsoft", ENV.microsoftIssuerUrl, ENV.microsoftClientId, ENV.microsoftClientSecret);
    } catch (error) {
      console.error("[OAuth] Microsoft callback failed", error);
      redirectAuthError(res, "Microsoft sign-in failed. Please try again.");
    }
  });

  app.post("/api/auth/email/request", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }
    if (!ENV.emailApiKey) {
      res.status(503).json({ error: "Email sign-in is not configured. Set EMAIL_API_KEY and EMAIL_FROM." });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await db.createMagicLinkToken(email, tokenHash, new Date(Date.now() + 10 * 60 * 1000));
    const link = `${origin(req)}/api/auth/email/callback?token=${encodeURIComponent(rawToken)}`;

    try {
      const html = `<p>Sign in to Assessment Workbench:</p><p><a href="${link}">Continue securely</a></p><p>This link expires in 10 minutes and can only be used once.</p>`;
      await axios.post(
        "https://api.resend.com/emails",
        { from: ENV.emailFrom, to: [email], subject: "Your Assessment Workbench sign-in link", html },
        { headers: { Authorization: `Bearer ${ENV.emailApiKey}`, "Content-Type": "application/json" }, timeout: 10_000 },
      );
      res.json({ sent: true });
    } catch (error) {
      console.error("[OAuth] Email delivery failed", error);
      res.status(502).json({ error: "Could not send email sign-in link" });
    }
  });

  app.get("/api/auth/email/callback", async (req, res) => {
    const rawToken = getQuery(req, "token");
    if (!rawToken) {
      res.status(403).json({ error: "This email sign-in link is invalid or expired" });
      return;
    }
    try {
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const email = await db.consumeMagicLinkToken(tokenHash);
      if (!email) {
        res.status(403).json({ error: "This email sign-in link is invalid or expired" });
        return;
      }
      await createCandidateSession(req, res, "email", email, email, email, true);
    } catch (error) {
      console.error("[OAuth] Email callback failed", error);
      redirectAuthError(res, "Email sign-in failed. Please try again.");
    }
  });
}
