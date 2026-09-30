# 📄 Development Rules

# **ECOFlow — Project Guidelines for AI & Human Collaboration**

This document defines the development rules, coding standards, and best practices for the ECOFlow application. These rules ensure consistency, maintainability, security, and quality. Both AI assistants and human contributors must follow these guidelines.

---

## 1️⃣ General Principles

These rules apply to the entire project.

- ✅ Follow the project documentation (PRD, ARCHITECTURE, DESIGN) before making changes.
- ✅ Keep the code clean, readable and well-structured.
- ✅ Prioritize simplicity and maintainability.
- ✅ Do not duplicate logic. Reuse existing components, utilities or services.
- ✅ Make small, focused changes instead of large, risky edits.
- ✅ Do not modify unrelated files.
- ✅ Write self-explanatory code with meaningful variable and function names.
- ✅ Every change must pass `tsc` on both `server/` and `client/` before commit.

---

## 2️⃣ Technology & Coding Standards

Rules related to the tech stack and coding style:

| | Area | Rule |
|---|---|---|
| 🟦 | **Language** | Use TypeScript everywhere. Avoid `any` unless absolutely necessary. |
| 🧩 | **Frontend** | React function components + hooks; follow `client/src` folder conventions (`api/`, `components/`, `context/`, `pages/`). |
| 🎨 | **Styling** | Use Tailwind CSS and follow the design system in DESIGN.md (colors: `primary #6366f1`, surface `#18181b`, glass utilities). |
| 🛠️ | **Backend** | Express: route → middleware (`authenticate`, `authorize`) → controller → Prisma. No DB logic in routes. |
| 🔍 | **Linting** | ESLint must pass on the client (`npm run lint`). |
| 📦 | **Dependencies** | Use stable, well-maintained packages. Justify any new dependency in the PR description. |
| 📁 | **File Naming** | Routes: `*.routes.ts`, controllers: `*.controller.ts`, API clients: `*.api.ts`, React components: `PascalCase.tsx`. |
| 🔐 | **Secrets** | Never commit `.env`, JWT secrets, API keys, or connection strings. Use platform env vars (Render/Netlify). |

---

## 3️⃣ Project Structure

Follow the defined folder structure in ARCHITECTURE.md to keep the codebase organized:

- ✅ Place reusable UI components in `client/src/components/` and feature pages in `client/src/pages/`.
- ✅ Feature-specific API calls must go through typed clients in `client/src/api/`.
- ✅ Database and external service logic must live in `server/src/controllers/` and `server/src/config/` — never in route files.
- ✅ Common utilities should be in `server/src/utils/` (jwt, password, cloudinary).
- ✅ Prisma schema changes require a migration (`npx prisma migrate dev`) — never edit the generated client.
- ✅ Do not create new folders without a clear structural reason.
- ✅ New API endpoints MUST be added to both `server/postman/postman.json` and `client/postman/postman.json`.

---

## 4️⃣ API & Security Rules

- ✅ All new routes require `authenticate`; write endpoints additionally require `authorize('ROLE')`.
- ✅ Validate request bodies (`express-validator` or explicit checks) before touching the database.
- ✅ Return consistent shapes: success `{ status, message, data }`, error `{ status: 'error', message }`.
- ✅ Never leak stack traces in production responses (see `server.ts` error handler).
- ✅ Log every state-changing action to the audit log (ECO lifecycle, user management, role changes).
- ✅ Suspended users (`SUSPENDED`) must be rejected by the auth middleware.

---

## 5️⃣ Git & Deployment Rules

- ✅ Small, frequent commits with descriptive messages (e.g. `fix: save accessToken from login response`).
- ✅ Never commit directly to `main` without CI passing (Render/Netlify auto-deploy on push).
- ✅ Keep `render.yaml` and `netlify.toml` in sync with any new env vars — document them in README.md.
- ✅ Backend start command is always `npm start` (compiled `dist/`), never `npm run dev`.
- ✅ Run `npx prisma migrate deploy` on the platform for schema changes before first traffic.
