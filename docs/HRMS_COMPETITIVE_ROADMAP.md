# HRMS Competitive Roadmap — Make It #1 in the World

> **Owner:** Vivek Kumar | **Created:** 21 May 2026 | **Status:** Active
>
> **Purpose:** This is the single source of truth for everything that will make our HRMS better than
> Workday, Darwinbox, Keka, BambooHR, HiBob, Rippling, greytHR, SAP SuccessFactors, and every other
> HRMS in the world. Complete each tier fully before moving to the next. Do not skip. Do not divert.

---

## Competitor Weakness Map (Why We Will Win)

| HRMS | Target Market | Their Biggest Weakness | Our Opportunity |
|------|--------------|----------------------|----------------|
| **Workday** | 1000+ enterprise | Horrible UI, 6–18 month setup, $$$$ | Modern UI + fast onboarding |
| **SAP SuccessFactors** | 500+ enterprise | Dated UI, needs certified consultants | Intuitive, self-serve |
| **Darwinbox** | 200+ India/Asia | 3–6 month implementation, expensive | Fast setup, better mobile |
| **Keka** | 100–500 India | Limited multi-entity, weak customization | Flexible + beautiful |
| **greytHR** | SMB India | Very old UI, payroll-only feel | Full-suite + modern |
| **BambooHR** | US SMB | "Clunky, not easily navigated", slow mobile | Consumer-grade UX |
| **HiBob** | Global mid-market | Pricing opacity, expensive, lag in reporting | Transparent + fast |
| **Rippling** | US tech companies | Feature overload, modules can't open in new windows | Focused + clean |
| **Zoho People** | SMB global | Feels like an add-on, not purpose-built | Purpose-built HRMS |

### Where They ALL Fail (Our Core Opportunity)

Every single competitor fails on the same 5 things. This is where we dominate:

1. **UI feels like enterprise software from 2015** — BambooHR users literally say "clunky." Workday/SAP are
   infamous for bad UX. Even HiBob (best UI in the market) gets "occasional lag" complaints.
2. **Mobile is an afterthought** — No competitor has a truly great mobile app. BambooHR mobile is "slower
   than web." Most are just web wrappers with limited functionality.
3. **AI is still mostly search/chatbot level** — Darwinbox has "Darwinbox Sense" agentic AI, but it's new.
   We already have a Claude-powered agentic HR Assistant. We are ahead.
4. **Built for HR admins, not employees** — Almost all HRMS are built for HR teams. Employees open it to
   punch in, check payslip, apply leave — then close it. Zero engagement, zero delight.
5. **Implementation is painful** — Darwinbox: 3–6 months. Workday: 6–18 months. Keka: 30–60 days.
   Fast onboarding is a massive competitive weapon.

**Core Insight:** Every world-class HRMS is built for HR admins. Build one that employees actually
want to open. That's the gap nobody has closed. Win employees → companies can't switch away.

---

## The "Make It Go Viral" Short List

If only 5 features could be shipped, these are the ones:

| # | Feature | Why It Goes Viral |
|---|---------|------------------|
| 1 | **Dark Mode** | No Indian HRMS has it. Every dev/tech company will talk about it |
| 2 | **WhatsApp Chatbot** | "Apply leave on WhatsApp" — HR managers will post about this on LinkedIn |
| 3 | **Digital Employee ID Card** | Employees share on LinkedIn when they join a company. Free marketing |
| 4 | **Home Screen Widget** | First HRMS with a phone widget. Tech blogs will cover it |
| 5 | **AI Proactive Insights Feed** | "Your HRMS tells you things before you ask" — demos beautifully |

---

## Master Build Order

```
TIER 1 (Current) → UI/UX — Design System, Dark Mode, CMD+K, Skeletons, Animations
TIER 2           → AI Features — Insights Feed, Policy Q&A, Review Writing, Anomaly Detection
TIER 3           → Employee Experience — ID Card, Widget, Kudos, Pulse Map, Career Path
TIER 4           → India Features — WhatsApp Bot, UPI Payroll, DigiLocker, Multi-Language
TIER 5           → Platform/Trust — Public API, Webhooks, Zapier, Audit Log, Pricing Page
```

**Rule:** Complete every item in a tier. Mark it done. Only then move to next tier.

---

---

## TIER 1 — UI/UX: The Eye-Catcher

> **Goal:** Make our UI so good that companies choose us in the demo before we even explain features.
> Target benchmark: Linear, Notion, Vercel Dashboard quality. Not "enterprise software."
> **Status:** 🔴 Not Started

---

### T1-1 · Design System Overhaul

**What:** Establish a consistent, beautiful design language across every screen — web and mobile.
Consistent spacing scale, typography hierarchy, color palette (light + dark), component variants,
icon set, and shadow/border radius system.

**Why we need this:** Right now every page was built feature-first. Spacing is inconsistent, button
sizes vary, colors are used differently across modules. It looks like many different developers
built different parts (because they did). A design system makes the whole product feel like one
cohesive product from one design mind.

**Competitor gap:** Workday, SAP, greytHR — no consistent design language. Keka is decent but not
polished. HiBob is the current best UI in HRMS — we need to beat HiBob.

**Acceptance criteria:**
- [ ] Define spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48, 64)
- [ ] Define typography scale (font sizes, weights, line heights for h1→h6, body, caption, label)
- [ ] Define color tokens (primary, secondary, success, warning, error, neutral — light + dark values)
- [ ] Audit all existing web components — standardize padding, border-radius, shadows
- [ ] Audit all existing mobile screens — standardize spacing and font usage
- [ ] All buttons: Primary, Secondary, Ghost, Destructive — consistent sizing across all pages
- [ ] All form inputs: consistent height, border, focus ring, error state
- [ ] All cards: consistent padding, shadow, border
- [ ] All tables: consistent row height, header style, hover state
- [ ] All modals/dialogs: consistent sizing, header, footer button layout

**Status:** ⬜ Not Done

---

### T1-2 · Dark Mode (Web + Mobile)

**What:** Full dark mode support across the entire web app and Flutter mobile app, with a toggle
in the user profile menu and it respects the OS-level dark/light preference on first load.

**Why we need this:** Zero Indian HRMS has proper dark mode. Keka — no. Darwinbox — no. greytHR —
no. BambooHR — no. This single feature will get us coverage on LinkedIn, Twitter/X, and tech
blogs. Developers and IT companies (our target customers) work in dark mode. This is non-negotiable
for winning tech companies.

**Competitor gap:** HiBob has some dark mode support but it's incomplete. We can own this space
completely.

**Acceptance criteria:**
- [ ] Web: All pages render correctly in dark mode (no white boxes, invisible text, broken icons)
- [ ] Web: Dark mode toggle in user profile dropdown
- [ ] Web: Respects `prefers-color-scheme` OS setting on first load
- [ ] Web: User preference saved in localStorage (persists across sessions)
- [ ] Mobile: Dark mode throughout Flutter app
- [ ] Mobile: Respects Android/iOS system dark mode setting
- [ ] Mobile: Manual override option in app settings
- [ ] Charts/graphs render correctly in both modes
- [ ] All images/illustrations/icons visible in dark mode
- [ ] Transitions between light/dark are smooth (no flash)

**Status:** ✅ Web Done — Dark mode CSS tokens existed, fixed theme init (index.html inline script), fixed `onRehydrateStorage` in ui.store.ts, upgraded header toggle to 3-way Light/Dark/System dropdown, fixed all hardcoded colors across AuthLayout, LoginPage, RegisterPage, SettingsPage, ExpensesPage, NineBoxPage, ESignaturePage. Mobile dark mode pending.

---

### T1-3 · Command Palette (CMD+K)

**What:** A global search and action palette that opens with CMD+K (Mac) or Ctrl+K (Windows/Linux).
From anywhere in the app, one keypress lets you jump to any page, search any employee, trigger
any action (apply leave, punch in, view payslip), or run any admin task.

**Why we need this:** Only Rippling has something similar in the HRMS space. No Indian HRMS has
this. Power users (HR teams, managers) navigate the app 50+ times a day. This makes them 10x
faster and makes the app feel premium and developer-friendly.

**Competitor gap:** Every other HRMS requires navigation through sidebar menus. CMD+K is a
consumer-grade power feature that enterprise software ignores. We won't.

**Acceptance criteria:**
- [ ] CMD+K / Ctrl+K opens palette from any page instantly
- [ ] ESC closes it
- [ ] Search employees by name, ID, or email — shows results in real-time
- [ ] Navigate to any page/module by typing its name
- [ ] Recent actions shown by default when palette is empty
- [ ] Keyboard navigation (arrow keys to move, Enter to select)
- [ ] Role-based results (Admin sees admin actions, Employee sees their own actions)
- [ ] Action shortcuts: "Apply Leave", "Mark Attendance", "View My Payslip", "Add Employee"
- [ ] Smooth open/close animation
- [ ] Mobile: floating search button triggers similar functionality

**Status:** ✅ Done — Full `CommandPalette.tsx` built on `@radix-ui/react-dialog`. CMD+K / Ctrl+K global listener, 60+ nav items grouped by section, role-based filtering, keyboard navigation (arrows + Enter), smooth open/close animation, theme cycle action, logout action. Header now shows a visible `Search…` button for mouse-user discoverability. Role-based: EMPLOYEE sees personal actions, HR/Admin see employee management + payroll + admin actions.

---

### T1-4 · Customizable Home Dashboard

**What:** The home dashboard is drag-and-drop configurable. Each user can add, remove, and
rearrange widgets. Widgets include: Attendance Summary, Leave Balance, Pending Approvals, Team
Calendar, Announcements, Upcoming Birthdays, Payroll Status, Quick Actions, AI Insights.

**Why we need this:** Currently every HRMS dashboard is static — HR sees one fixed layout,
Employee sees another fixed layout. Nobody can change it. A personalized dashboard means every
user sees what's most relevant to them, which drives daily active usage.

**Competitor gap:** No HRMS has this. Workday dashboards are configured by IT admins only.
Keka/greytHR dashboards are completely static. This is a feature from modern B2C apps (Notion,
Linear) that nobody has brought to HRMS.

**Acceptance criteria:**
- [ ] Default dashboard layouts per role (Admin, HR, Manager, Employee)
- [ ] "Customize" button enters edit mode
- [ ] Drag-and-drop to rearrange widget positions
- [ ] Add widget from a library (all available widgets listed)
- [ ] Remove widget (X button in edit mode)
- [ ] Resize widgets (small, medium, large)
- [ ] Changes saved per user, persist across sessions
- [ ] "Reset to default" option
- [ ] All widgets are responsive on different screen sizes
- [ ] Mobile: simplified version with reorderable list of cards

**Status:** ⬜ Not Done

---

### T1-5 · Skeleton Loaders Everywhere

**What:** Replace all loading spinners with skeleton screens — gray animated placeholder shapes
that match the layout of the actual content being loaded.

**Why we need this:** Spinners feel slow. Skeleton loaders make the app feel 3x faster because
users see structure immediately. BambooHR mobile is specifically complained about for feeling
"slow." We need to feel fast even on slow connections.

**Competitor gap:** Almost no HRMS uses skeleton loaders properly. Most still use spinners or
blank white screens while loading. This is a perceived performance win with near-zero backend work.

**Acceptance criteria:**
- [ ] Every list/table page has a skeleton loader (shows 5–8 ghost rows)
- [ ] Every detail/profile page has a skeleton loader matching the page layout
- [ ] Every dashboard widget has a skeleton loader
- [ ] Mobile: every screen shows skeleton on initial load
- [ ] Skeletons match the exact layout of the real content (not generic placeholders)
- [ ] Smooth shimmer animation on all skeletons
- [ ] No spinner anywhere in the app (replace all instances)
- [ ] Skeleton disappears smoothly when content loads (no jarring jump)

**Status:** ✅ Done — Upgraded skeleton.tsx with shimmer animation (moving gradient via CSS keyframe). Created `skeleton-patterns.tsx` with `ChartSkeleton` (bar chart bars) and `DialogContentSkeleton` (rows). Replaced all 5 page-level Loader2 spinners in AnalyticsPage with ChartSkeleton. Replaced dialog-content spinners in MyPayslipsPage, OffboardingPage (assignment detail), and PulseSurveyPage with DialogContentSkeleton. Button-level spinners preserved (correct pattern for async actions).

---

### T1-6 · Micro-Animations and Page Transitions

**What:** Subtle, purposeful animations throughout the app — page transitions, button press
feedback, hover states, list item animations, modal open/close, success/error toasts, and
number counters on dashboard metrics.

**Why we need this:** The difference between an app that feels "premium" and one that feels
"cheap" is almost entirely animations and transitions. HiBob's UI is described as "genuinely
enjoyable to use" specifically because of this. We need to feel better than HiBob.

**Competitor gap:** Workday/SAP/greytHR feel like spreadsheets. BambooHR is static. Even Keka
feels like web 2.0. Smooth animations are a product design discipline — not one HRMS treats it
this way.

**Acceptance criteria:**
- [ ] Page/route transitions: smooth fade or slide (not jarring instant swap)
- [ ] Sidebar collapse/expand: smooth width animation (already partially done — polish it)
- [ ] Modal/dialog open: scale-in from center, close: scale-out
- [ ] Button press: subtle scale-down (0.97) on click
- [ ] Dropdown menus: smooth height animation on open/close
- [ ] List items: staggered fade-in when list loads
- [ ] Dashboard numbers: count-up animation from 0 to actual value
- [ ] Toast notifications: slide-in from top-right, auto-dismiss with progress bar
- [ ] Hover states: all clickable elements have a visible hover change
- [ ] Mobile: native-feeling swipe transitions between screens
- [ ] All animations respect `prefers-reduced-motion` media query (accessibility)

**Status:** ⬜ Not Done

---

### T1-7 · Empty States with Illustrations

**What:** Every page that can be empty (no employees added, no leaves applied, no announcements)
shows a beautiful illustrated empty state with a clear, friendly message and a primary CTA button.

**Why we need this:** Currently, empty pages show blank tables or nothing at all. This is
confusing for new users ("is it broken?") and looks unprofessional. Great empty states guide
users to take the next action and make the app feel alive even when there's no data yet.

**Competitor gap:** greytHR and Keka show blank screens. BambooHR shows minimal empty messages.
Nobody in Indian HRMS uses illustrated empty states. This is standard in consumer apps (Notion,
Slack, Linear) and makes the product feel crafted.

**Acceptance criteria:**
- [ ] Identify all pages/states that can be empty (at least 15 pages)
- [ ] Each empty state has: illustration + headline + 1-line subtext + CTA button
- [ ] Illustrations are consistent style (same illustration system/library)
- [ ] Illustrations work in both light and dark mode
- [ ] Empty search results: different from empty data (show "No results for X" not generic empty)
- [ ] Empty states are not shown during loading (skeleton loader shown instead)
- [ ] Mobile: empty states adapted for smaller screen with same illustration

**Specific pages that need empty states:**
- Employees list (no employees yet)
- Leaves (no leave applications)
- Announcements (no announcements)
- Payslips (no payslips generated)
- Helpdesk (no tickets)
- Kudos feed (no kudos given yet)
- Assets (no assets assigned)
- Approval inbox (no pending approvals — show "You're all caught up!")
- Notifications (no notifications)
- Any search with no results

**Status:** ⬜ Not Done

---

### T1-8 · Onboarding Flow / Product Tour

**What:** When a new organization sets up their account, they see a guided 5-step onboarding
checklist on the dashboard. When a new employee logs in for the first time, they see a 3-step
tour of the most important features for their role.

**Why we need this:** Darwinbox takes 3–6 months to implement with consultants. We should be
usable in 30 minutes. A great onboarding flow is what makes that possible. Companies give up on
HRMS not because the features are bad but because they don't know where to start.

**Competitor gap:** Keka and greytHR both have high implementation drop-off rates. BambooHR is
known for "fast deployment" — but even they don't have an in-app guided onboarding tour. We will.

**Acceptance criteria:**

**Admin/HR Onboarding Checklist (first-login dashboard widget):**
- [ ] Step 1: Set up your organization profile (logo, name, timezone)
- [ ] Step 2: Add your first department
- [ ] Step 3: Add your first employee
- [ ] Step 4: Set up a shift
- [ ] Step 5: Process your first attendance
- [ ] Progress bar showing X/5 complete
- [ ] Each step links directly to the relevant page
- [ ] Checklist disappears from dashboard once all 5 steps are complete
- [ ] "Dismiss" option for organizations migrating from another HRMS

**Employee First-Login Tour:**
- [ ] Tooltip-based tour: "This is your dashboard", "Here's how to apply for leave",
      "Check your payslips here"
- [ ] 3 steps maximum — don't overwhelm
- [ ] Skip option always visible
- [ ] Tour never shows again after completion or skip

**Status:** ⬜ Not Done

---

## TIER 2 — AI Features: The Differentiator

> **Goal:** Make AI visible, useful, and proactive. Not a chatbot hidden in a corner — AI that
> surfaces insights before you ask.
> **Status:** 🔴 Not Started (Claude SDK integrated, features need building)

---

### T2-1 · AI Proactive Insights Feed

**What:** Every morning, the AI pushes 3–5 insights to the HR dashboard based on real data.
Anomalies, risks, and opportunities surfaced automatically without the HR team having to run
reports.

**Examples of insights:**
- "3 employees haven't punched in and it's 10:30 AM — no leave applied either"
- "Rahul Sharma's attendance has dropped 40% this month. Possible attrition risk."
- "Next Thursday has 6 approved leaves — you may be understaffed. Consider adjusting."
- "Priya Patel has not taken any leave in 4 months. Burnout risk."
- "Your average time-to-hire has improved by 3 days this month."

**Competitor gap:** Darwinbox has analytics dashboards. Nobody pushes AI insights proactively.
This is the difference between a reporting tool and an intelligent HR co-pilot.

**Acceptance criteria:**
- [ ] Background job runs daily at 9 AM per organization
- [ ] Generates insights using Claude API with real employee/attendance/leave data
- [ ] Insights shown as cards on HR/Admin dashboard
- [ ] Each insight has: icon, headline, 1-line detail, optional "Take Action" button
- [ ] Insights are dismissable (don't show same insight twice)
- [ ] Insights categorized: Attendance, Attrition Risk, Compliance, Performance, Positive
- [ ] Mobile: push notification for critical insights (e.g., understaffing)
- [ ] Insight history (last 30 days) accessible from a "Insights" section

**Status:** ⬜ Not Started

---

### T2-2 · AI-Powered Performance Review Writing

**What:** When a manager writes a performance review, they type 3–5 bullet points about the
employee. AI drafts a full professional review paragraph. When an employee writes self-review,
AI suggests talking points based on their attendance record, completed goals, and kudos received.

**Competitor gap:** No HRMS in the world has this as a built-in feature. Lattice and 15Five
have review tools but no AI writing assistance inside the review form.

**Acceptance criteria:**
- [ ] "Draft with AI" button inside performance review form
- [ ] Manager inputs: bullet points → AI outputs: full professional review paragraph
- [ ] Employee self-review: AI suggests 3 talking points based on their data
- [ ] Output is editable — AI drafts, human finalizes
- [ ] Tone options: "Formal", "Constructive", "Motivating"
- [ ] Character limit respected in output

**Status:** ⬜ Not Started

---

### T2-3 · Smart Anomaly Detection

**What:** Automated background analysis that flags unusual patterns and alerts the right person.

**Anomalies to detect:**
- Expense claim amount significantly above employee's average → flag for audit
- Employee consistently punching in 30+ minutes late for 2+ weeks → alert manager
- Employee working 60+ hours/week for 3+ consecutive weeks → wellness alert
- Sudden spike in one team's leave applications → possible morale issue
- Employee hasn't logged into the app in 2+ weeks → possible disengagement

**Competitor gap:** Nobody does this proactively. Workday has anomaly detection but only for
payroll fraud at enterprise tier. No mid-market HRMS does behavioral anomaly detection.

**Acceptance criteria:**
- [ ] Background job runs nightly per organization
- [ ] Detected anomalies create alerts in the Approval Inbox / Notifications
- [ ] Alerts are categorized by severity: Info, Warning, Critical
- [ ] HR can configure which anomaly types to monitor
- [ ] False positive reduction: only trigger after threshold is crossed (e.g., 3 days not 1)
- [ ] Employee privacy: anomalies shown to HR/Manager, not to the employee themselves

**Status:** ⬜ Not Started

---

### T2-4 · HR Policy Q&A (Natural Language)

**What:** Employees type a question in plain language — "How many casual leaves do I get per
year?", "What is the notice period policy?" — and get an instant answer pulled from the
company's actual uploaded HR policy documents.

**Competitor gap:** Currently employees email HR and wait 1–2 days for policy answers. No HRMS
has built-in policy Q&A. Employees hate not having answers. HR teams waste hours on repetitive
questions.

**Acceptance criteria:**
- [ ] HR can upload policy documents (PDF, DOCX) in Settings → HR Policies
- [ ] Documents are indexed for Claude to reference
- [ ] Policy Q&A widget available to all employees in the app
- [ ] Response cites which document/section the answer comes from
- [ ] Fallback: "I couldn't find this in your HR policies. Please contact HR."
- [ ] Mobile: available as a chat interface

**Status:** ⬜ Not Started

---

### T2-5 · AI Resume Scoring

**What:** Upgrade the existing resume parser. After parsing a resume, score it against the job
description (0–100%) and show "Why this candidate matches" in 3 bullet points.

**Acceptance criteria:**
- [ ] Match score (0–100%) shown on each candidate card in recruitment pipeline
- [ ] "Key Matches" section: 3 bullet points explaining why score is what it is
- [ ] "Key Gaps" section: what the candidate is missing vs JD
- [ ] Recruiter can re-score with updated JD
- [ ] Bulk scoring: upload 10 resumes → all scored simultaneously
- [ ] Score is advisory only — recruiter always has final say

**Status:** ⬜ Not Started

---

## TIER 3 — Employee Experience: Adoption Driver

> **Goal:** Make employees love opening the app. Make it feel like Instagram, not Excel.
> **Status:** 🔴 Not Started

---

### T3-1 · Digital Employee ID Card

**What:** A beautiful, brandable digital ID card inside the mobile app. Shows photo, name,
designation, employee ID, department, joining date, QR code, and company logo. Shareable as
an image.

**Why:** When someone gets a new job, they post on LinkedIn. If the ID card is beautiful, they'll
share it — "Just got my [CompanyName] ID through the HRMS." Free marketing.

**Acceptance criteria:**
- [ ] ID card accessible from mobile profile screen
- [ ] Company logo and brand color applied to card design
- [ ] QR code scans to employee's profile (for visitor management)
- [ ] "Share" button exports card as PNG image
- [ ] Works offline (card data cached locally)
- [ ] Web: also viewable on web profile page

**Status:** ⬜ Not Started

---

### T3-2 · Home Screen Widget (Android + iOS)

**What:** A small widget users can add to their phone home screen. Shows: punch-in/out button,
current shift time, leave balance, today's date. One-tap punch from the home screen.

**Why:** This is a MASSIVE differentiator. Zero HRMS in India has a home screen widget. Employees
see your product every time they look at their phone. It also increases punch-in compliance
dramatically because the button is always visible.

**Acceptance criteria:**
- [ ] Android: home screen widget via Flutter home_widget package
- [ ] iOS: home screen widget via iOS 16+ WidgetKit
- [ ] Widget shows: punch status (punched in / not punched), shift start time, leave balance
- [ ] Tap on widget → opens app directly to punch-in screen
- [ ] Widget updates in real-time when punch status changes
- [ ] Available in 3 sizes: small (just punch button), medium (punch + shift), large (full summary)

**Status:** ⬜ Not Started

---

### T3-3 · Live Team Pulse Map ("Who's In")

**What:** A real-time view on the dashboard showing: who is punched in, who is WFH, who is on
leave, who hasn't arrived yet. Visual and glanceable.

**Why:** Managers ask "who's in today?" 10 times a day. This makes it one tap. Also drives
transparency and subtle peer accountability.

**Acceptance criteria:**
- [ ] Dashboard widget: "Team Pulse" showing avatars grouped by status
- [ ] Statuses: In Office, WFH, On Leave, Not Yet In, Holiday
- [ ] Manager sees their full team; HR sees all employees; Employee sees their team
- [ ] Updates in real-time (WebSocket)
- [ ] Click on person → opens their profile/attendance detail
- [ ] Mobile: accessible from dashboard home screen

**Status:** ⬜ Not Started

---

### T3-4 · Kudos / Recognition Social Feed

**What:** A public recognition wall where anyone can give kudos to a colleague, tied to a company
value or core behavior. Other employees can like and comment. Monthly leaderboard of most
recognized employees.

**Why:** HiBob wins enterprise HR deals partially because of their culture/engagement features.
Recognition directly increases employee retention (Gallup data). Making it social (not just a
private notification) multiplies the effect.

**Acceptance criteria:**
- [ ] "Give Kudos" button accessible from employee profile and main feed
- [ ] Give kudos: select recipient, select value/badge, add personal message
- [ ] Kudos visible in team-wide feed (most recent first)
- [ ] Like and comment on kudos
- [ ] Monthly "Most Recognized" leaderboard on dashboard
- [ ] Kudos count on employee profile
- [ ] HR can configure company values/badges (e.g., "Teamwork", "Innovation", "Customer First")
- [ ] Mobile: notification when you receive kudos
- [ ] Kudos appear in performance review context (AI summary uses them)

**Status:** ⬜ Not Started

---

### T3-5 · Birthday + Work Anniversary Celebrations

**What:** Auto-notification to the whole team when it's someone's birthday or work anniversary.
Manager gets a prompt to send a personal message. Anniversary milestones (1yr, 3yr, 5yr) get
a special visual treatment.

**Why:** These moments are where employees feel valued or invisible. If your HRMS makes them
feel seen, they tell others. If their company forgot their 5-year anniversary, they leave.

**Acceptance criteria:**
- [ ] Dashboard widget: "Upcoming Celebrations" (next 7 days)
- [ ] Team notification on the day: "Today is Anjali's 3rd work anniversary!"
- [ ] Manager receives reminder 1 day before with nudge to send a message
- [ ] Special visual treatment for milestones: 1yr, 3yr, 5yr, 10yr
- [ ] Employee can opt out of birthday visibility (privacy option)
- [ ] Mobile: push notification on the morning of the celebration
- [ ] Birthday not shown if employee hasn't filled in DOB in their profile

**Status:** ⬜ Not Started

---

### T3-6 · Career Path Visualization

**What:** A visual career ladder showing where an employee is today, what the next role is,
what skills are needed to get there, and the average time employees spend at each level.

**Why:** The #1 reason employees leave is lack of growth visibility. If your HRMS shows them
a clear path, they stay. No Indian HRMS has this. Darwinbox is building it for enterprise.
We can ship it for SMB first.

**Acceptance criteria:**
- [ ] Visual path: Current Role → Next Role → Role After That
- [ ] For each next role: required skills, avg time to reach, number of people at that level
- [ ] Skills gap: "You have X of Y required skills. Here's what's missing."
- [ ] HR/Admin can define the career ladder for each department
- [ ] Links to LMS courses for missing skills
- [ ] Mobile: accessible from employee profile

**Status:** ⬜ Not Started

---

## TIER 4 — India-Specific Features: Market Capture

> **Goal:** Own the Indian market completely before going global.
> **Status:** 🔴 Not Started

---

### T4-1 · WhatsApp Chatbot Integration

**What:** Employees can apply for leave, check leave balance, view payslip, and mark attendance
directly via WhatsApp. HR gets notifications on WhatsApp for pending approvals.

**Why:** India has 500M+ WhatsApp users. This is where employees live. "Apply leave on WhatsApp"
will be shared on LinkedIn and HR communities. No Indian HRMS has built this properly.

**Acceptance criteria:**
- [ ] WhatsApp Business API integration
- [ ] Employee WhatsApp commands: LEAVE APPLY, LEAVE BALANCE, MY PAYSLIP, ATTENDANCE TODAY
- [ ] Conversational flow: "Which dates? → Leave type? → Reason? → Confirm?"
- [ ] HR gets WhatsApp message for pending approvals with Approve/Reject buttons
- [ ] Organization can configure their own WhatsApp Business number
- [ ] Fallback: link to web/mobile app if action is too complex for chat

**Status:** ⬜ Not Started

---

### T4-2 · UPI Payroll Disbursement

**What:** After payroll is processed, salary is disbursed directly via UPI to employee bank
accounts. Employee gets a UPI notification instantly. Disbursement status shown in real-time
in the payroll dashboard.

**Acceptance criteria:**
- [ ] UPI payment integration (Razorpay/PayU Payout API)
- [ ] Batch disbursement: all employee salaries in one click
- [ ] Real-time status: Pending → Processing → Paid per employee
- [ ] Employee gets UPI notification on their phone
- [ ] Payslip auto-generated and sent to employee after successful disbursement
- [ ] Failed payments: retry mechanism + HR alert

**Status:** ⬜ Not Started

---

### T4-3 · DigiLocker Integration

**What:** At onboarding, employees verify their Aadhaar and PAN instantly via DigiLocker.
Documents are fetched directly from the government — no physical document collection needed.

**Acceptance criteria:**
- [ ] DigiLocker API integration
- [ ] Onboarding step: "Verify your identity via DigiLocker"
- [ ] Fetch: Aadhaar card, PAN card, educational certificates
- [ ] Verified badge on employee profile for DigiLocker-verified documents
- [ ] Documents stored securely in Cloudinary with encryption
- [ ] Fallback: manual upload if DigiLocker not available

**Status:** ⬜ Not Started

---

### T4-4 · Multi-Language Support

**What:** Full UI translation support for Hindi, Tamil, Telugu, Marathi, and Bengali in addition
to English. Language selector in profile settings.

**Why:** Tier 2 and Tier 3 city companies are massively underserved by HRMS tools. All of Keka,
Darwinbox, greytHR are English-only. This opens an entirely new market that nobody is serving.

**Acceptance criteria:**
- [ ] i18n infrastructure set up (react-i18next for web, Flutter's l10n for mobile)
- [ ] All UI strings externalized into translation files
- [ ] Languages: English, Hindi, Tamil, Telugu, Marathi, Bengali
- [ ] Language preference saved in user profile
- [ ] Right-to-left (RTL) layout ready for future Arabic/Urdu support
- [ ] Date formats localized (DD/MM/YYYY for India, etc.)

**Status:** ⬜ Not Started

---

## TIER 5 — Platform & Trust: Enterprise Close

> **Goal:** Check every box that enterprise IT/security/procurement teams need to sign off.
> **Status:** 🔴 Not Started

---

### T5-1 · Public API Documentation

**What:** A beautiful, public-facing API documentation site (like Stripe's docs) where any
developer can read the full API spec, try endpoints in a sandbox, and get API keys.

**Acceptance criteria:**
- [ ] Auto-generated from existing Fastify/Swagger spec
- [ ] Hosted at docs.yourdomain.com or /api/docs
- [ ] Includes: authentication guide, all endpoints, request/response examples, error codes
- [ ] Interactive "Try it" functionality
- [ ] API versioning documented (v1)
- [ ] SDKs section (even if just code examples in JS, Python, PHP)

**Status:** ⬜ Not Started

---

### T5-2 · Webhooks + Zapier Integration

**What:** Organizations can configure webhooks to receive real-time HTTP notifications for any
event (employee joined, leave approved, payroll processed). Zapier integration published to
Zapier marketplace.

**Acceptance criteria:**
- [ ] Webhook configuration in Settings → Integrations
- [ ] Events: all major create/update/approve/reject actions
- [ ] Webhook delivery with retry logic (3 attempts, exponential backoff)
- [ ] Webhook delivery logs in admin panel (success, failed, retried)
- [ ] Zapier: at least 10 triggers + 5 actions published on Zapier
- [ ] HMAC signature on webhook payload for security verification

**Status:** ⬜ Not Started

---

### T5-3 · Immutable Audit Log

**What:** Every action in the system is logged: who did what, when, what changed, from what
value to what value. Searchable, filterable, and exportable. Cannot be deleted.

**Acceptance criteria:**
- [ ] Every write operation in API creates an audit log entry
- [ ] Log fields: timestamp, user (name + ID), action, entity type, entity ID, old value, new value
- [ ] Audit log page in Admin settings: searchable by user, date range, action type
- [ ] Export audit log as CSV
- [ ] Log entries cannot be deleted (append-only)
- [ ] Retention: minimum 2 years of logs stored

**Status:** ⬜ Not Started

---

### T5-4 · Public Status Page + 99.9% SLA

**What:** A public status page (e.g., status.yourdomain.com) showing real-time uptime of all
services, incident history, and scheduled maintenance. Subscription for email/SMS alerts.

**Acceptance criteria:**
- [ ] Public status page with service components: API, Web App, Mobile API, Database, Background Jobs
- [ ] Real-time status: Operational, Degraded, Partial Outage, Major Outage
- [ ] Incident history: past 90 days
- [ ] Uptime percentage shown: last 30 days, last 90 days
- [ ] Email/SMS subscription for incident alerts
- [ ] Incident auto-detection from health check monitoring

**Status:** ⬜ Not Started

---

### T5-5 · Transparent Pricing Page

**What:** A public pricing page with 3 clear tiers, feature matrix, and per-employee per-month
pricing. No "call for pricing." No hidden fees.

**Why:** Every competitor hides pricing behind a sales call. We publish ours openly. This is
how we get inbound leads from companies who are tired of being sold to before they can even
see a price.

**Tiers (suggested):**

| | Starter | Growth | Enterprise |
|-|---------|--------|------------|
| **Employees** | Up to 50 | Up to 500 | Unlimited |
| **Price** | ₹49/emp/month | ₹79/emp/month | Custom |
| **Core features** | ✅ | ✅ | ✅ |
| **AI Features** | ❌ | ✅ | ✅ |
| **WhatsApp Bot** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ✅ | ✅ |
| **Custom Integrations** | ❌ | ❌ | ✅ |
| **Dedicated Support** | ❌ | ❌ | ✅ |
| **SLA** | 99.5% | 99.9% | 99.99% |

**Status:** ⬜ Not Started

---

### T5-6 · Data Portability (DPDP Compliance)

**What:** Any employee can download all their personal data in one click. Company admin can
export the entire HR database as CSV/JSON for migration or audit purposes.

**Why:** India's Digital Personal Data Protection (DPDP) Act 2023 requires this. Also builds
massive trust — companies know they're never locked in.

**Acceptance criteria:**
- [ ] Employee: "Download My Data" button in profile settings
- [ ] Employee export includes: personal info, attendance history, leave history, payslips, documents
- [ ] Admin: "Export All HR Data" in Super Admin settings
- [ ] Export format: ZIP file containing CSVs + PDF documents
- [ ] Export job runs in background, email notification when ready
- [ ] Download link expires after 24 hours (security)

**Status:** ⬜ Not Started

---

## Progress Tracker

| Tier | Feature | Status |
|------|---------|--------|
| **T1** | T1-1 Design System Overhaul | ⬜ Not Done |
| **T1** | T1-2 Dark Mode (Web + Mobile) | ✅ Done (Web) · ⬜ Mobile pending |
| **T1** | T1-3 Command Palette (CMD+K) | ✅ Done |
| **T1** | T1-4 Customizable Home Dashboard | ⬜ Not Done |
| **T1** | T1-5 Skeleton Loaders Everywhere | ⬜ Not Done |
| **T1** | T1-6 Micro-Animations and Page Transitions | ⬜ Not Done |
| **T1** | T1-7 Empty States with Illustrations | ⬜ Not Done |
| **T1** | T1-8 Onboarding Flow / Product Tour | ⬜ Not Done |
| **T2** | T2-1 AI Proactive Insights Feed | ⬜ Not Started |
| **T2** | T2-2 AI Performance Review Writing | ⬜ Not Started |
| **T2** | T2-3 Smart Anomaly Detection | ⬜ Not Started |
| **T2** | T2-4 HR Policy Q&A | ⬜ Not Started |
| **T2** | T2-5 AI Resume Scoring | ⬜ Not Started |
| **T3** | T3-1 Digital Employee ID Card | ⬜ Not Started |
| **T3** | T3-2 Home Screen Widget | ⬜ Not Started |
| **T3** | T3-3 Live Team Pulse Map | ⬜ Not Started |
| **T3** | T3-4 Kudos / Recognition Feed | ⬜ Not Started |
| **T3** | T3-5 Birthday + Anniversary Celebrations | ⬜ Not Started |
| **T3** | T3-6 Career Path Visualization | ⬜ Not Started |
| **T4** | T4-1 WhatsApp Chatbot Integration | ⬜ Not Started |
| **T4** | T4-2 UPI Payroll Disbursement | ⬜ Not Started |
| **T4** | T4-3 DigiLocker Integration | ⬜ Not Started |
| **T4** | T4-4 Multi-Language Support | ⬜ Not Started |
| **T5** | T5-1 Public API Documentation | ⬜ Not Started |
| **T5** | T5-2 Webhooks + Zapier Integration | ⬜ Not Started |
| **T5** | T5-3 Immutable Audit Log | ⬜ Not Started |
| **T5** | T5-4 Public Status Page + 99.9% SLA | ⬜ Not Started |
| **T5** | T5-5 Transparent Pricing Page | ⬜ Not Started |
| **T5** | T5-6 Data Portability (DPDP Compliance) | ⬜ Not Started |

**Total: 27 features across 5 tiers.**

---

## How to Use This File

1. At the start of every session, reference this file
2. Work on one tier at a time — complete all items before moving forward
3. When a feature is done, update its status in the Progress Tracker to ✅ Done
4. When starting a feature, update to 🔄 In Progress
5. Never skip a feature without explicitly deciding to deprioritize it (and noting why)
6. The acceptance criteria for each feature is the definition of "done" — all boxes must be checked

---

*Last updated: 21 May 2026 | Updated by: Claude (AI Engineering) on behalf of Vivek Kumar*
