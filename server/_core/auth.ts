import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { type Request, type Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

export type SessionPayload = {
  userId: number;
  appId: string;
  name: string;
};

function getSessionSecret() {
  if (!ENV.cookieSecret || ENV.cookieSecret.length < 32) {
    throw new Error("JWT_SECRET must be set and contain at least 32 characters");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function signSession(
  userId: number,
  name: string,
  options?: { expiresInMs?: number },
) {
  const expiresInMs = options?.expiresInMs ?? ONE_YEAR_MS;
  return new SignJWT({
    userId,
    appId: ENV.appId,
    name,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + expiresInMs) / 1000))
    .sign(getSessionSecret());
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSessionSecret(), {
    algorithms: ["HS256"],
  });

  if (typeof payload.userId !== "number" || typeof payload.appId !== "string") {
    throw new Error("Invalid session payload");
  }

  return {
    userId: payload.userId,
    appId: payload.appId,
    name: typeof payload.name === "string" ? payload.name : "",
  };
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;

  const token = parseCookieHeader(rawCookie)[COOKIE_NAME];
  if (!token) return null;

  try {
    const session = await verifySession(token);
    if (session.appId !== ENV.appId) return null;
    return (await getUserById(session.userId)) ?? null;
  } catch {
    return null;
  }
}

export function setSessionCookie(req: Request, res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: ONE_YEAR_MS,
  });
}

export function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, {
    ...getSessionCookieOptions(req),
    maxAge: -1,
  });
}
