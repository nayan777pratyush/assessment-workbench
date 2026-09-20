export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export type AuthProvider = "github" | "oidc" | "google" | "microsoft";

export const startProviderLogin = (provider: AuthProvider) => {
  window.location.href = `/api/auth/${provider}/start`;
};

export const startLogin = async () => {
  try {
    const response = await fetch("/api/auth/providers", { credentials: "include", cache: "no-store" });
    const providers = response.ok ? await response.json() : null;
    const preferred: AuthProvider[] = ["google", "github", "microsoft", "oidc"];
    const provider = preferred.find(name => Boolean(providers?.[name]));
    if (provider) {
      startProviderLogin(provider);
      return;
    }
  } catch {
    // Fall through to the landing page with a useful configuration message.
  }
  window.location.href = "/?auth_error=No sign-in provider is configured yet.";
};
