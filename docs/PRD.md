# 📋 Product Requirements Document (PRD)

# **ECOFlow — Engineering Change Order Version Master Data System**

| | |
|---|---|
| **Version:** | 2.0 |
| **Date:** | Sep 30, 2026 |
| **Author:** | Team ECOFlow |
| **Status:** | ✅ In Development |
| **Target Launch:** | MVP (v1.0) |

---

## 1. Product Overview

ECOFlow is a web application that helps manufacturing and engineering teams manage **Engineering Change Orders (ECOs)**. It provides version-controlled Product and BOM (Bill of Materials) master data, multi-stage approval workflows, real-time notifications, and a complete audit trail — all in one place.

---

## 2. Problem Statement

Engineering teams struggle to track **who changed what, when, and why** in product/BOM data. Changes happen over email, spreadsheets, and verbal approvals — leading to production errors, untraceable revisions, and compliance risk. There is no single source of truth with gated approvals.

---

## 3. Goals

- Provide a **single source of truth** for product & BOM master data with full version history.
- Enforce a **gated ECO workflow**: DRAFT → IN_REVIEW → APPROVED → APPLIED.
- Support **role-based access** (ADMIN, ENGINEERING, APPROVER, OPERATIONS).
- Deliver **real-time notifications** (SSE) for review requests, approvals and broadcasts.
- Keep an immutable **audit log** of every action.

---

## 4. Target Users

| | |
|---|---|
| **Roles** | ADMIN, ENGINEERING, APPROVER, OPERATIONS |
| **Users** | Manufacturing engineers, approvers/managers, production operators |
| **Org type** | Small–mid manufacturing / PLM teams |
| **Needs** | Traceable changes, controlled approvals, read-only shop-floor views |

---

## 5. Core Features (MVP)

1. **Authentication** — Signup (admin-approved), login, JWT access/refresh tokens, profile & password management.
2. **Product Master Data** — Create/update products, versioning, archive.
3. **BOM Management** — Components, operations, versioning, publish.
4. **ECO Lifecycle** — Draft changes (components/operations), submit, multi-stage review, apply to live data.
5. **Role Management** — Assign roles, role requests with admin approval.
6. **Notifications** — Real-time SSE stream, read state, admin broadcasts.
7. **Reports** — Audit logs, ECO stats, version history, archived products, active matrix.
8. **Comparisons** — ECO diff and BOM version-to-version comparison.
9. **Attachments** — Product & ECO file uploads (Cloudinary).
10. **Operations View** — Read-only active products/BOMs for the OPERATIONS role.

---

## 6. Non-Goals (v1)

- CAD file rendering / PLM integrations (ERP, MES).
- Offline mode.
- Multi-language UI.
- Mobile native apps (responsive web only).

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| ECO cycle time (submit → applied) | < 48h median |
| Audit coverage | 100% of changes logged |
| API availability (Render) | ≥ 99% monthly |
| p95 API latency | < 300ms |
