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

## New Updates:

- TIER 1 — Critical Gaps (Daily-use features employees worldwide love most)

1. Onboarding Module ❌
   Every top platform (Darwinbox, BambooHR, Rippling, Keka) considers this the #1 differentiator.

Joining form & document collection automation (PAN, Aadhaar, bank details, etc.)
New hire task checklists — assign tasks to IT (give laptop), Finance (create bank), HR (issue ID card), buddy
Offer letter generation + digital acceptance
Welcome email automation on date of joining
Compliance training auto-assigned on day 1 2. Offboarding Module ❌
Resignation submission + manager approval workflow
Exit interview questionnaire
Clearance checklist (IT, Finance, Admin, Manager sign-off)
Knowledge transfer task assignment
Access revocation trigger
Rehire eligibility flag 3. Full & Final (FnF) Settlement Calculator ❌
India's #1 requested feature in Keka, GreytHR, Darwinbox reviews. Calculates final salary, pending leaves encashment, gratuity, deductions, and generates the FnF payslip automatically.

4. Investment Proof Collection / IT Declaration ❌ (partially pending)
   Form 12BB submission, 80C / 80D / HRA / LTA proofs upload, TDS computation sheet visible to employees — heavily used every January–March in India. Without this, tax is over-deducted.

5. Attendance Regularization (I think regularise is the same thing).
   Employees forget to punch, work from a different location, or punch fails due to network. Every major HRMS lets employees submit a "missed punch correction" request with reason. Manager approves it. Currently missing entirely.

6. Work From Home (WFH) Requests ❌
   Separate from leave — WFH is not a leave but a location status. Employees apply for WFH, manager approves, attendance auto-marks as "WFH" instead of "Absent." Darwinbox, Keka, Zoho People all have this as a separate module.

7. Comp-off (Compensatory Off) Management (I think this is also built as comp off)
   When an employee works on a holiday or weekend, they earn a comp-off. Currently no mechanism to: (a) earn comp-off from weekend work, (b) apply it as leave, (c) track balance. Keka and Darwinbox users cite this as essential.

8. Shift Swap Requests ❌
   Employees can request another employee to swap a shift. Manager approves. UKG Pro even allows SMS-based acceptance. Very common requirement in companies with 2+ shifts.

9. Self-Service Employment Documents ❌
   Employees cannot generate these on-demand (instant PDF): Experience Letter, Employment Verification Letter, Salary Certificate, Relieving Letter. In every top HRMS, these are one-click. Currently employees must ask HR to generate manually.

10. Employee Referral Portal ❌
    Employees submit candidate referrals directly from the app, track referral status, and receive referral bonus when hired. One of the highest ROI recruitment sources. BambooHR, Darwinbox, Keka all have this built-in.

- TIER 2 — Important Gaps (What separates good HRMS from great) 11. Pulse Surveys / Employee Engagement Surveys ❌
  Short pulse surveys (5–10 questions, weekly or monthly)
  eNPS (Employee Net Promoter Score) — "How likely are you to recommend this company?"
  Lifecycle surveys — auto-triggered at Day 30, Day 90, every 6 months, and on exit
  Culture Amp, 15Five, and Keka are globally praised specifically for this 12. Social Recognition Feed ❌ (Kudos pending but no social wall)
  Points-based rewards, company-wide recognition feed where everyone sees appreciation posts, values-aligned badges, service anniversary auto-posts, birthday celebrations. Keka's "Celebrate" and Darwinbox's recognition wall are among the most loved features in their respective user reviews.

13. Performance Improvement Plan (PIP) ❌
    When an employee underperforms, HR/manager creates a PIP with goals, timeline, and check-in schedule. Both parties digitally acknowledge. Progress tracked. Outcome recorded. Lattice is the #1 rated platform on G2 partly because of this.

14. Nine-Box Grid (Performance vs. Potential) ❌
    Visual 3×3 grid that maps all employees by performance rating vs. potential. Identifies HiPos (high potential), flight risks, and underperformers at a glance. Used in every talent review meeting. Lattice, Workday, and SAP SuccessFactors are heavily praised for this.

15. Career Path Visualization ❌
    Shows an employee what roles they can grow into from their current role, what skills they need, and how others made that transition. Reduces attrition by giving employees a future to work toward.

16. Succession Planning ❌
    For critical roles, HR identifies 2–3 successors with readiness ratings (Ready Now / 1–2 Years / 3–5 Years). Prevents leadership gaps. Oracle HCM and Workday are industry standards for this.

17. Benefits Administration ❌
    Group health insurance enrollment (Mediclaim), Group Term Life, NPS enrollment, Perks management (gym, meals, transport). Employees select their benefits during joining and open enrollment windows. Heavily requested in Indian enterprise HRMS reviews.

18. Headcount / Workforce Planning ❌
    Department-wise headcount budget, open position tracking, attrition scenario modeling. Without this, HR can't justify new hires to leadership. Workday and Oracle HCM are the gold standard here.

19. POSH Case Management ❌
    Prevention of Sexual Harassment Act (India) — mandatory for any company with 10+ employees. A private, confidential case filing system with ICC committee workflow. GreytHR and Darwinbox have this as a dedicated module. This is a legal compliance requirement in India.

20. Timesheet / Project Time Tracking ❌
    Employees log hours by project (billable vs. non-billable). Manager approves. Feeds into client billing or project cost analysis. Very important for IT companies, consulting firms, agencies.

21. Policy Acknowledgment Tracking ❌
    HR uploads policies (Employee Handbook, Code of Conduct, IT Policy). Employees must read and digitally acknowledge. HR dashboard shows who has and hasn't signed. Used as legal protection in case of disputes.

22. Compliance Calendar ❌
    Monthly view of all statutory deadlines — PF challan by 15th, ESI by 15th, PT by state deadlines, TDS by 7th, Form 24Q quarterly. Currently there is nothing alerting HR of upcoming compliance deadlines.

23. Salary Revision / Appraisal Workflow ❌
    After performance reviews, HR/manager proposes a revised salary. Multi-level approval. Notification to employee. New CTC effective from a date. Currently payroll has no mechanism for structured revision cycles linked to performance.

24. AI Chatbot / Virtual HR Assistant ❌
    The most impactful 2025 feature. Employees ask: "How many leaves do I have?" "When is my next payslip?" "What's the company's WFH policy?" The AI answers instantly. BambooHR's "Ask BambooHR" and Darwinbox's "Jinie" are among the most praised features in reviews globally.

TIER 3 — Enterprise / Scale Features (Build when user base grows)
Feature Who has it Why it matters
Earned Wage Access (on-demand pay) Gusto, ADP, Rippling Employee can withdraw earned salary before payday — reduces financial stress, huge retention tool
Attrition Prediction (AI) Workday, Oracle, Culture Amp Flags employees likely to resign 60–90 days before they do, based on patterns
Org Chart (dynamic, visual, clickable) All major platforms Employees navigate the company visually. Check if yours is interactive
Biometric device integration (ZKTeco, ESSL) Darwinbox, Keka, GreytHR Physical attendance machines used in factories/offices sync directly to HRMS
Bulk/Campus Hiring Darwinbox, Keka Mass hiring drives, walk-ins, bulk offer letters
Pay Equity Analysis Workday, Lattice Report on gender/role pay gaps — increasingly a legal requirement
Multi-language UI SAP, Oracle, Zoho If company has non-English employees
Interview Scorecard (ATS) BambooHR, Darwinbox, Keka Structured interview feedback forms with ratings per competency
Resume Parsing (AI) All major ATS Bulk upload resumes → auto-create candidate profiles
Contractor / Gig Worker Management Rippling, ADP Separate profile type, PO-based payment, no payroll
ESOP / Equity Management Rippling, Workday Grant, vest, exercise tracking for startups giving ESOPs
Mental Health / EAP Integrations BambooHR, Keka Links to Employee Assistance Programs
The 5 Biggest Gaps Employees Notice First
Based specifically on G2 and Capterra employee reviews (not HR admin reviews):

Can't fix wrong attendance themselves → Regularization is #1 pain point when missing
No WFH tracking → Employees marked absent even when working from home
Can't get their own letters → Still emailing HR for experience/salary certificate
No recognition wall → Appreciation is invisible; morale suffers
No pulse survey → Employees feel unheard; no anonymous feedback channel
Bottom line: Your HRMS is solid on the transactional side (attendance, leaves, payroll, assets, travel, loans). The biggest gaps are in the lifecycle layer (onboarding/offboarding), employee experience layer (surveys, recognition wall, career paths, WFH, regularization), and India compliance layer (FnF, POSH, investment declarations). These are the features that determine whether employees like using the system daily vs. just tolerating it.

_Last Updated: May 2026 | Maintained by Vivek Kumar_
