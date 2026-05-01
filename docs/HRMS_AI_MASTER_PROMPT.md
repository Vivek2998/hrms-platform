# HRMS Project — AI Manager's Master Prompt File
> **Version:** 1.0 | **Owner:** Vivek Kumar | **Status:** Active  
> **Purpose:** This is your single source of truth. Feed this file to Claude AI (or any AI agent) at the start of every session. The AI is your engineering team — you are the Product Manager.

---

## 🧠 ABOUT THIS FILE

This `.md` file is your **project bible**. Every time you start a new conversation with Claude AI or any other AI agent, paste this file's content (or reference it) at the start. It contains:

- Full project context and architecture decisions
- Your role vs AI's role
- All Git workflows (AI handles 100% of git operations)
- Feature backlog
- How to give requirements in minimal tokens

---

## 👤 YOUR ROLE (VIVEK — PRODUCT MANAGER)

You give:
- Feature requirements in plain English
- Real-world feedback ("the punch-in button is confusing")
- Acceptance or rejection of AI's work
- Business decisions (pricing, target customers, branding)

You **never** manually write code, run git commands, or configure infrastructure.

---

## 🤖 AI AGENT'S ROLE (100% Engineering)

The AI must:
- Write all code (frontend, backend, mobile, database schemas)
- Handle all Git operations: `init`, `add`, `commit`, `push`, `pull`, `merge`, `rebase`, conflict resolution
- Set up CI/CD pipelines
- Write tests
- Refactor and optimize code
- Document everything
- Ask clarifying questions before starting a feature (never assume)

---

## 🏗️ TECH STACK (FINAL — DO NOT CHANGE WITHOUT MANAGER APPROVAL)

### Frontend — Web Application
- **Framework:** React 19 (with Vite bundler)
- **UI Library:** shadcn/ui + Tailwind CSS v4
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query v5)
- **Forms:** React Hook Form + Zod validation
- **Charts/Analytics:** Recharts
- **Auth (Web):** JWT + HTTP-only cookies

### Mobile — iOS & Android
- **Framework:** Flutter 3.x (Dart)
- **State Management:** Riverpod
- **Navigation:** GoRouter
- **Local Storage:** Hive (offline support)
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Biometric Auth:** local_auth package

### Backend — API Server
- **Runtime:** Node.js 22 LTS
- **Framework:** Fastify v5 (faster than Express, better TypeScript support)
- **Language:** TypeScript
- **ORM:** Prisma v6
- **Database:** PostgreSQL 16 (primary) + Redis 7 (cache/sessions/queues)
- **Job Queue:** BullMQ (shift reminders, notifications)
- **File Storage:** Cloudinary (employee photos, documents)
- **Realtime:** Socket.io (live attendance dashboard)

### DevOps & Infrastructure
- **Version Control:** GitHub (Vivek's account)
- **Git Tool on Local:** **Antigravity IDE** (Google's AI-native VS Code fork — handles all git via agent commands)
- **CI/CD:** GitHub Actions
- **Containerization:** Docker + Docker Compose (local dev)
- **Deployment:** Railway.app (backend) + Vercel (web frontend) + App stores (mobile)
- **Environment Secrets:** GitHub Secrets + `.env` files (never committed)

### AI Development Tools
- **Primary AI Coding Agent:** Claude AI (claude.ai or Claude Code extension)
- **Secondary:** GitHub Copilot (in-editor autocomplete)
- **Workflow:** Claude plans + implements → Antigravity commits via agent → GitHub Actions validates → Vivek reviews

---

## 📁 REPOSITORY STRUCTURE

```
hrms-platform/
├── apps/
│   ├── web/                    # React web application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── stores/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── types/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── mobile/                 # Flutter mobile app (iOS + Android)
│   │   ├── lib/
│   │   │   ├── features/
│   │   │   ├── shared/
│   │   │   ├── core/
│   │   │   └── main.dart
│   │   └── pubspec.yaml
│   │
│   └── api/                    # Fastify backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── employees/
│       │   │   ├── attendance/
│       │   │   ├── shifts/
│       │   │   ├── leaves/
│       │   │   ├── payroll/
│       │   │   └── notifications/
│       │   ├── plugins/
│       │   ├── prisma/
│       │   └── server.ts
│       └── package.json
│
├── packages/
│   ├── shared-types/           # TypeScript types shared between web & api
│   └── shared-utils/           # Common utilities
│
├── docs/
│   ├── HRMS_AI_MASTER_PROMPT.md   # THIS FILE
│   ├── api-spec.md
│   ├── db-schema.md
│   └── feature-specs/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── turbo.json                  # Turborepo monorepo config
└── README.md
```

---

## 🗄️ DATABASE SCHEMA (CORE TABLES)

The AI must use Prisma migrations. Never modify the database directly.

### Core Models
```
Organization → Departments → Teams → Employees
Employees → Shifts → AttendanceRecords
Employees → LeaveRequests → LeaveApprovals
Employees → Payroll → PayslipItems
Employees → Documents
Employees → Roles (RBAC)
```

### Key Rules
- All timestamps in UTC, display in user's local timezone
- Soft deletes on all major tables (`deletedAt` field)
- Every attendance record stores: `punchIn`, `punchOut`, `shiftId`, `status` (PRESENT/ABSENT/LATE/HALF_DAY/WFH), `location` (GPS coordinates), `punchInPhoto` (selfie URL)
- Shift model: `startTime`, `endTime`, `graceMinutes`, `halfDayAfterMinutes`, `breakDuration`, `isNightShift`

---

## ✅ FEATURE BACKLOG (PRIORITY ORDER)

### Phase 1 — Foundation (Start Here)
- [x] Project scaffolding & monorepo setup
- [ ] Database schema & Prisma migrations
- [ ] Auth module: Login, JWT refresh tokens, role-based access (Admin, HR, Manager, Employee)
- [ ] Employee CRUD: Create, Read, Update, Archive employee profiles
- [ ] Department & Team management
- [ ] Shift management: Create and assign shifts to employees or departments

### Phase 2 — Attendance Core
- [ ] Punch-in / Punch-out (web + mobile)
  - GPS location capture
  - Selfie photo capture (mobile)
  - Geofencing validation (office radius check)
  - Late arrival detection against shift start time
- [ ] Attendance dashboard (real-time, using Socket.io)
- [ ] Attendance reports (daily, weekly, monthly)
- [ ] Manual attendance correction (by HR/Admin with reason log)

### Phase 3 — Leave Management
- [ ] Leave types setup (Annual, Sick, Casual, Compensatory, etc.)
- [ ] Leave application (employee self-service)
- [ ] Leave approval workflow (multi-level: Manager → HR)
- [ ] Leave balance calculation (auto-deduct, carry-forward rules)
- [ ] Leave calendar (team-level visibility)

### Phase 4 — Payroll
- [ ] Salary structure templates (CTC breakdown)
- [ ] Monthly payroll calculation (attendance-linked deductions)
- [ ] Payslip generation (PDF export)
- [ ] Statutory deductions (PF, ESI, TDS — India-compliant)

### Phase 5 — Advanced Features
- [ ] Holiday calendar management
- [ ] Overtime tracking & approval
- [ ] Employee document vault
- [ ] Announcements & notices board
- [ ] Performance review cycles
- [ ] Asset assignment tracking
- [ ] Mobile: Offline punch support with sync
- [ ] AI-powered insights (attendance patterns, attrition risk)

---

## 🔀 GIT WORKFLOW (AI HANDLES EVERYTHING)

### Branch Strategy
```
main          ← Production-ready code only
develop       ← Integration branch
feature/*     ← New features (e.g., feature/attendance-punchin)
fix/*         ← Bug fixes
hotfix/*      ← Critical production fixes
release/*     ← Pre-release preparation
```

### AI Git Commands to Use (via Antigravity or terminal)
```bash
# Starting a new feature
git checkout develop
git pull origin develop
git checkout -b feature/<feature-name>

# Committing (AI must write descriptive commit messages)
git add .
git commit -m "feat(attendance): add GPS-based punch-in with geofencing validation

- Capture GPS coordinates on punch-in/out
- Validate within 200m office radius
- Store location in attendance_records table
- Add error handling for GPS permission denial

Closes #<issue-number>"

# Pushing
git push origin feature/<feature-name>

# Creating PR (via GitHub CLI — gh)
gh pr create --base develop --title "feat: attendance punch-in" --body "..."

# Merging (after review)
git checkout develop
git merge --no-ff feature/<feature-name>
git push origin develop
```

### Conflict Resolution (AI handles this)
When a merge conflict occurs, AI must:
1. Run `git status` to identify conflicted files
2. Open each file and analyze both versions
3. Resolve by keeping the correct logic (explain reasoning in comment)
4. Run `git add <resolved-files>`
5. Run `git commit` to complete the merge
6. Never use `git merge --abort` without explaining why to Vivek first

### Commit Message Convention (MANDATORY)
Format: `type(scope): short description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

Examples:
```
feat(auth): implement JWT refresh token rotation
fix(attendance): correct late calculation for night shifts crossing midnight
perf(api): add Redis caching for employee list endpoint
docs(api): update Swagger spec for leave endpoints
```

---

## 🤖 HOW TO GIVE REQUIREMENTS TO AI (MINIMAL TOKENS)

Use this template when giving Vivek's requirements:

### Template
```
FEATURE: <name>
WHAT: <what it does in 1-2 sentences>
WHO: <which user role uses this>
ACCEPTANCE: 
  - <bullet 1>
  - <bullet 2>
EDGE CASES: <any special cases to handle>
SKIP: <anything explicitly NOT needed>
```

### Example
```
FEATURE: Leave Application
WHAT: Employee submits a leave request with date range and type
WHO: Employee role
ACCEPTANCE:
  - Can select leave type from available types
  - Shows remaining balance before submitting
  - Manager gets email + push notification
  - Employee can cancel if status is still PENDING
EDGE CASES: Block submission if overlapping leave exists
SKIP: SMS notifications (Phase 5 only)
```

---

## 🚦 SESSION START PROTOCOL

Every time you start a new AI session, say this:

> "Read the HRMS master prompt. We are building an industrial-grade HRMS SaaS product. Current phase: **[Phase 1/2/3...]**. Today's task: **[describe task]**. Use the tech stack and git workflow defined in the master prompt. Ask me before making any architecture decisions."

---

## 🔐 SECURITY RULES (NON-NEGOTIABLE)

- Never commit `.env` files — use `.env.example` with placeholder values
- Never log passwords, tokens, or PII in console/logs
- All API endpoints must check auth middleware first
- Rate limiting on all public endpoints (using `@fastify/rate-limit`)
- Input validation on ALL fields (Zod on backend, Zod on frontend)
- File uploads: virus scan + extension whitelist + max size limit
- HTTPS only in production
- CORS: whitelist specific origins, no wildcard `*` in production

---

## 📐 CODE QUALITY STANDARDS

- TypeScript strict mode: `"strict": true` in tsconfig
- ESLint + Prettier enforced via Husky pre-commit hooks
- Unit tests for all business logic (Vitest)
- API tests for all endpoints (supertest)
- Minimum 70% test coverage before merging to `develop`
- No `any` type in TypeScript without a comment justification
- All async functions must have try/catch or proper error boundaries

---

## 📱 MOBILE-SPECIFIC RULES (FLUTTER)

- Support Android 8.0+ (API 26+) and iOS 14+
- Offline-first: BullMQ queue pending actions when offline, sync when online
- Biometric authentication for fast login (Face ID / Fingerprint)
- Background location tracking only when actively punched in (battery-aware)
- Support both LTR and RTL layouts (future i18n readiness)
- Deep links: `hrms://attendance/punchin`, `hrms://leaves/apply`

---

## 🌐 API DESIGN RULES

- RESTful with consistent response envelope:
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "total": 100 },
  "error": null
}
```
- All dates in ISO 8601 format (UTC): `2026-05-01T13:00:00Z`
- Pagination on all list endpoints: `?page=1&limit=20`
- API versioning: `/api/v1/...`
- Swagger/OpenAPI docs auto-generated via `@fastify/swagger`
- WebSocket events follow: `module:action` pattern (e.g., `attendance:punchIn`, `notification:new`)

---

## 🏁 SETUP INSTRUCTIONS FOR FIRST SESSION

Tell Claude AI this in the first session:

```
Set up the full HRMS monorepo from scratch on my machine.

1. Create the folder structure as defined in the master prompt
2. Initialize Turborepo monorepo (pnpm workspaces)
3. Scaffold the React + Vite web app with TypeScript, Tailwind, shadcn/ui
4. Scaffold the Fastify + Prisma + TypeScript API
5. Scaffold the Flutter mobile app with Riverpod and GoRouter
6. Set up Docker Compose with PostgreSQL and Redis
7. Initialize Git repository
8. Create .gitignore, .env.example files
9. Set up GitHub Actions CI workflow (lint + test on PR)
10. Make initial commit and push to GitHub remote: [YOUR GITHUB REPO URL]

Use pnpm as the package manager. Ask me for GitHub credentials/repo URL before pushing.
Do step-by-step, confirm each step before proceeding.
```

---

## 💡 TIPS FOR SELLING THIS AS SAAS

- Build multi-tenancy from Day 1 (each company = one Organization record, data isolated by `organizationId`)
- Subscription tiers to implement later: Starter (up to 50 employees), Growth (up to 500), Enterprise (unlimited + custom branding)
- Admin super-panel (separate from org admin) for managing all tenants
- GDPR/data export ready (employee can export their own data)
- Audit logs on every critical action (who changed what, when)
- White-label support (custom logo, colors, domain)

---

*Last Updated: May 2026 | Maintained by Vivek Kumar*
