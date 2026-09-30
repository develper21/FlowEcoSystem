# 🧠 Project Memory

# **ECOFlow — Context, Progress & Important Notes**

This document keeps track of the current state of the project, important decisions, and things to remember. It helps maintain continuity across development sessions, AI assistant context, or new contributors.

---

| 📅 | | | |
|---|---|---|---|
| **Last Updated** | **Current Phase** | **Branch** | **Deploys** |
| Sep 30, 2026 | **Phase 7** — Docs & Release | `main` | Render (API) + Netlify (Web) |

---

## 🎯 Current Status

| | |
|:---:|---|
| ✅ | Express + TypeScript backend with Prisma/PostgreSQL (13 route modules, 85+ endpoints) |
| ✅ | React 19 + Vite + Tailwind frontend (dark glass UI, React Router v7) |
| ✅ | JWT auth with access + refresh tokens, multi-role RBAC (ADMIN/ENGINEERING/APPROVER/OPERATIONS) |
| ✅ | ECO lifecycle complete: draft → submit → multi-stage review → apply |
| ✅ | Real-time SSE notifications + admin broadcasts |
| ✅ | Deploy configs fixed: `render.yaml`, `netlify.toml` with `/api` proxy rewrite |
| ✅ | Postman collection (87 requests) in `server/postman/` and `client/postman/` |
| 🔄 | Docs folder being finalized (this one) · Prisma migrations on deploy |

---

## ✅ Completed Milestones

| # | Milestone | Date |
|---|---|---|
| 1 | Backend scaffold + Prisma schema (User, Product, BOM, ECO domains) | Feb 2026 |
| 2 | Auth system (signup approval flow, JWT, RBAC middleware) | Feb 2026 |
| 3 | Product & BOM versioning APIs | Feb–Jun 2026 |
| 4 | ECO draft/submit/review/apply workflow + comparisons | Jun 2026 |
| 5 | SSE notifications, role requests, reports, attachments | Jun 2026 |
| 6 | Frontend pages complete (Products, BOMs, ECOs, Reports, Users…) | Jun 2026 |
| 7 | Render deploy fix (types → prod deps, `prisma generate` in build, `npm start`) | Sep 26, 2026 |
| 8 | Netlify `/api` proxy + env-driven API base URL in client | Sep 30, 2026 |

---

## 🔑 Important Technical Notes

| Topic | Note |
|---|---|
| **Server prod deps** | `typescript`, `prisma`, `@types/*` live in `dependencies` (Render sets NODE_ENV=production which skips devDeps). Don't move them back! |
| **Build chain** | `npm run build` = `prisma generate && tsc` → output in `server/dist/` |
| **Start command** | `npm start` → `node dist/server.js`. NEVER `npm run dev` (nodemon missing in prod) |
| **API base URL** | `client/src/api/client.ts` exports `API_BASE_URL` (`VITE_API_URL` or `/api`). Netlify proxies `/api/*` → Render. New SSE/EventSource code must import `API_BASE_URL` |
| **Netlify redirects** | `/api/*` proxy rule must stay **above** the `/*` SPA fallback — first match wins. Don't add `client/public/_redirects` (it would override toml order) |
| **SSE auth** | EventSource can't set headers — token goes as `?token=` query param |
| **Audit trail** | All ECO/user/role state changes must write audit logs |
| **Lockfile** | `server/package-lock.json` must stay in sync — it's what `npm ci` installs on Render |

---

## 🧭 Decisions Log

| Date | Decision | Why |
|---|---|---|
| Feb 2026 | Express + Prisma over NestJS | Team familiarity, smaller surface for a focused API |
| Feb 2026 | Multi-role users (array), not single role | Engineers can also approve; matches real orgs |
| Jun 2026 | Draft-then-apply ECO model | Live BOM never mutates mid-review; apply creates new versions atomically |
| Sep 2026 | Netlify proxy over direct CORS | Zero CORS config, same-origin cookies for SSE |
| Sep 2026 | Postman collection committed to repo | QA + onboarding can test the API without the UI |

---

## 🚧 Open Items / Next Up

- [ ] Add `prisma migrate deploy` to the Render deploy pipeline (task 7.2)
- [ ] Write Jest tests for controllers/middleware (jest + ts-jest already configured)
- [ ] Code-split client bundle (1.3 MB chunk → lazy-load routes)
- [ ] Lock CORS to the Netlify origin (currently `origin: '*'`)
- [ ] Add refresh-token rotation + revoke-on-logout for all devices
- [ ] Rate-limit auth endpoints more aggressively (login/signup)

---

## 💡 Remember (Gotchas)

1. **Vite publish dir is relative to base** — `netlify.toml` uses `base="client"` + `publish="dist"`, NOT `client/dist`.
2. **Postman id variables** — requests reference `{{productId}}`, `{{ecoId}}`, etc.; set them from GET responses before testing writes.
3. **`role.routes.ts` mounts at `/api/roles`** but paths are `/users/:id/roles` → full path is `/api/roles/users/:id/roles`.
4. **Attachments** are mounted at `/api` root: `/api/products/:id/attachments`, `/api/ecos/:id/attachments`, delete via `/api/products/attachments/:id`.
5. **`settings/stages/next/:seq`** returns the next approval stage after the given sequence number.
