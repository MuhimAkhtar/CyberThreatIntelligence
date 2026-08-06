### National Cyber Threat Intelligence Platform — Agent Rules & Conventions

This file is read by any agent (Antigravity or otherwise) working in this repo. Follow it exactly. If a task spec conflicts with this file, stop and ask rather than guessing which one wins.

---

## 1. Tech Stack (locked — do not substitute without approval)

- **Frontend:** React + Vite + TypeScript
- **Backend:** NestJS + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Cache / sessions:** Redis
- **Streaming:** Kafka (introduced in Phase 2, not before)
- **Search / indexing:** Elasticsearch or OpenSearch (introduced in Phase 2, not before)
- **ML:** TensorFlow (introduced in Phase 3+)
- **Containerization:** Docker, Docker Compose for local dev
- **Orchestration:** Kubernetes (later phases only)
- **Package manager:** pnpm (with workspaces) — not npm, not yarn
- **State management (frontend):** Zustand — not Redux/Redux Toolkit
- **Styling:** vanilla CSS with a custom design system (CSS variables for theming) — not Tailwind, not CSS-in-JS
- **API style:** REST only until a task spec explicitly calls for GraphQL. Do not add GraphQL speculatively "because the scope doc mentions it eventually."

Do not introduce a new library, framework, or service outside this list without asking first, even if it seems like an obvious improvement.

---

## 2. Conventions

- **Module-per-feature** on the backend (NestJS): each feature (auth, cves, alerts, iocs, etc.) is a self-contained module under `backend/src/modules/`.
- **File naming:** kebab-case (`alert-engine.service.ts`, not `AlertEngineService.ts`).
- **Commits:** Conventional Commits format — `feat(module): description`, `fix(module): description`, `chore(module): description`, `test(module): description`.
- **Tests:** every new service/endpoint ships with tests in the same PR/task. No "add tests later" tasks.
- **TypeScript:** strict mode on, both frontend and backend. No `any` without a comment explaining why.
- **Dark mode by default** on the frontend — this is a SOC tool used in low-light operations rooms.

---

## 3. Guardrails

- **Never commit real credentials, API keys, or `.env` files.** Only `.env.example` with placeholder values goes in git.
- **Never modify `/docs` or `.env` without asking first**, even if a task seems to require it.
- **Always write tests alongside new code** — not as a follow-up task.
- **Ask before adding any new dependency**, including dev dependencies.
- **Never connect to a live/production SIEM or real threat-intel feed with write access during development.** Sandbox or test accounts only.

---

## 4. Auth / RBAC Rules

- All authentication and authorization code must be flagged for **line-by-line human review** before merging — no exceptions, regardless of how small the change looks.
- Passwords: JWT for sessions, bcrypt for password hashing. No custom crypto.
- Four roles, exactly: `ADMIN`, `SOC_ANALYST`, `INVESTIGATOR`, `AUDITOR` (read-only).
- Every auth event (login, logout, failed login, token refresh) must write to the `AuditLog` table.
- Any endpoint that touches case data, evidence, or user management must be behind a `@Roles(...)` guard — there is no "authenticated but unrestricted" tier above Auditor.

---

## 5. Decisions Log — Proactive, Not On-Request

If an agent deviates from the scope document or this file for any reason (a library substitution, a schema change, a simplified version of a feature, a different approach than what was specced), it must **add an entry to `/docs/decisions.md` at the time it makes the decision** — not wait to be asked. Format:

```
### [YYYY-MM-DD] Short title
**Context:** what task this came up during
**Decision:** what was done instead of the original spec
**Reason:** why
**Reversible:** yes/no — what it would take to undo
```

An agent that makes an undocumented deviation has not completed the task, even if the code works.

---

## 6. Scope Discipline

- Work strictly from the current task spec. Do not "helpfully" implement adjacent features from later phases while working on an earlier one.
- If a task spec is ambiguous or missing information needed to proceed, ask — do not assume and build ahead of what was confirmed.
- Kafka, Elasticsearch/OpenSearch, and TensorFlow integrations do not belong in Phase 0/1 work under any circumstances, even as stubs, unless a task spec explicitly says otherwise.
