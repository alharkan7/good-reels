# Good Reels

## Cursor Cloud specific instructions

This is a single Next.js 16 application (not a monorepo). No databases, containers, or auth required.

### Services

| Service | Command | Port |
|---------|---------|------|
| Next.js dev server | `npm run dev` | 3000 |

### Standard commands

See `package.json` scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm start`.

### Environment variables

Copy `env.example` to `.env.local` for optional API keys (`GEMINI_API_KEY`, `JAMENDO_CLIENT_ID`). The app degrades gracefully without them — no secrets are required to run the dev server or pass lint/build.

### Gotchas

- Next.js 16 uses Turbopack by default for both dev and build.
- The project uses Tailwind CSS v4 via `@tailwindcss/postcss` — there is no `tailwind.config.js` file; Tailwind configuration is done via CSS (`app/globals.css`).
- ESLint v9 flat config is used (`eslint.config.mjs`), invoked with bare `eslint` (no `-- .` needed).
