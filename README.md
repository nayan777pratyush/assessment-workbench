# Assessment Workbench

Assessment Workbench is an evidence-first assessment experience for aptitude, coding, and full-stack evaluations. The candidate works in a focused workspace while evaluators can review the development process alongside the final result.

## Stack

- React 19 + TypeScript
- Vite
- Node.js + Express
- tRPC
- Drizzle ORM + PostgreSQL
- OAuth 2.0 / OpenID Connect

## Local setup

Requirements: Node.js 20+ and pnpm 10+.

```powershell
pnpm install
copy .env.example .env
```

Generate a session secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Put the result into `JWT_SECRET`. Then set `DATABASE_URL` to your PostgreSQL database and run:

```powershell
pnpm db:push
pnpm dev
```

Open `http://localhost:3000`.

## Authentication

Google is the recommended first provider. The login page only enables providers whose credentials are configured.

Local callbacks:

```text
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/auth/github/callback
http://localhost:3000/api/auth/microsoft/callback
http://localhost:3000/api/auth/oidc/callback
```

Production callbacks use the same paths under your HTTPS domain. The server validates OAuth state, stores provider identities in PostgreSQL, and creates an HTTP-only JWT session cookie.

## Quality checks

```powershell
pnpm check
pnpm test
pnpm build
```

## Deployment

The project includes an Express entry point for Vercel under `api/index.ts`. Set production environment variables in Vercel rather than committing secrets. Connect the GitHub repository to Vercel for automatic deployments.

The landing page uses an original assessment-workbench product visual inspired by the visual language of modern developer tools. It does not copy third-party artwork.
