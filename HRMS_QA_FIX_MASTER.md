# HRMS — QA Fix Master Document
# Generated: 2026-06-01 | Auditor: Senior QA Lead
# Purpose: Complete context for a fresh session to implement all fixes.
# Hand this file to the dev/AI assistant and say: "Read this file and fix every bug listed."

---

## PROJECT CONTEXT

**Stack:**
- Backend: Fastify 5 + Prisma + PostgreSQL + Redis + @fastify/jwt + Zod
- Frontend: React 19 + React Router + Zustand + Axios + React Query
- Auth: JWT access token (15m TTL) + refresh token (7d) stored in Redis
- Upload: Cloudinary with MIME allowlist
- Multi-tenant: every DB query must scope by `organizationId`
- Plans: FREE → STARTER → GROWTH → ENTERPRISE (gated by `requirePlan` middleware)

**Key file locations:**
- API entry: `apps/api/src/app.ts`
- Auth service: `apps/api/src/modules/auth/auth.service.ts`
- Auth routes: `apps/api/src/modules/auth/auth.routes.ts`
- Employee routes: `apps/api/src/modules/employees/employee.routes.ts`
- Employee service: `apps/api/src/modules/employees/employee.service.ts`
- Employee schema: `apps/api/src/modules/employees/employee.schema.ts`
- Leave routes: `apps/api/src/modules/leaves/leave.routes.ts`
- Payroll service: `apps/api/src/modules/payroll/payroll.service.ts`
- Payroll routes: `apps/api/src/modules/payroll/payroll.routes.ts`
- Upload routes: `apps/api/src/modules/upload/upload.routes.ts`
- Super admin routes: `apps/api/src/modules/super-admin/super-admin.routes.ts`
- Expense routes: `apps/api/src/modules/expenses/expense.routes.ts`
- Attendance routes: `apps/api/src/modules/attendance/attendance.routes.ts`
- Attendance service: `apps/api/src/modules/attendance/attendance.service.ts`
- Benefits routes: `apps/api/src/modules/benefits/benefits.routes.ts`
- Room routes: `apps/api/src/modules/rooms/room.routes.ts`
- Dashboard routes: `apps/api/src/modules/dashboard/dashboard.routes.ts`
- Plan guard: `apps/api/src/lib/plan-guard.ts`
- Pagination lib: `apps/api/src/lib/pagination.ts`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Auth store (web): `apps/web/src/stores/auth.store.ts`
- Axios client (web): `apps/web/src/lib/axios.ts`
- Router (web): `apps/web/src/routes/router.tsx`
- AuthGuard (web): `apps/web/src/components/guards/AuthGuard.tsx`
- RoleGuard (web): `apps/web/src/components/guards/RoleGuard.tsx`

**Role hierarchy (from DB enum):**
```
SUPER_ADMIN > ORG_ADMIN > HR > MANAGER > EMPLOYEE
```

**Pattern for role check in Fastify routes:**
```typescript
import { fail } from '../../lib/response.js';

// HR and above only:
const HR_ADMIN = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
if (!HR_ADMIN.includes(req.user.role)) throw fail('Forbidden', 403);

// Manager and above only:
const MANAGER_UP = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];
if (!MANAGER_UP.includes(req.user.role)) throw fail('Forbidden', 403);
```

---

## CRITICAL BUGS — MUST FIX BEFORE DEPLOYMENT

---

### BUG-C01 — GET /employees exposes PAN, Aadhaar, bank details to every authenticated user

**File:** `apps/api/src/modules/employees/employee.routes.ts` (line ~150)
**Also:** `apps/api/src/modules/employees/employee.service.ts` (EMPLOYEE_SELECT, line ~11)

**Root cause:**
`GET /employees` only requires JWT auth. The `EMPLOYEE_SELECT` constant includes
`panNumber`, `aadhaarNumber`, `pfAccountNumber`, `esiNumber`, `uanNumber`,
`bankAccountNumber`, `bankIfsc`, `bankName`, `bankBranch`, `presentAddress`,
`permanentAddress`, `emergencyContact`. Any authenticated employee can dump the
entire company's PII by calling `GET /api/v1/employees?limit=500`.

**Fix — two-part:**

PART A: Add role check to `GET /employees` route (employee.routes.ts):
```typescript
// GET /employees
app.get('/employees', auth, async (req, reply) => {
  // ADD THIS BLOCK:
  if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
    throw fail('Forbidden', 403);
  }
  const query = employeeListSchema.parse(req.query);
  const result = await listEmployees(req.user.orgId, query, app.prisma);
  return reply.send(result);
});
```

PART B: Create a redacted select for MANAGER role in employee.service.ts.
Add a new constant `EMPLOYEE_SELECT_REDACTED` that omits the sensitive fields,
and use it when `role === 'MANAGER'`:
```typescript
const EMPLOYEE_SELECT_REDACTED = {
  id: true,
  organizationId: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  displayName: true,
  workEmail: true,
  phone: true,
  role: true,
  status: true,
  employmentType: true,
  designation: true,
  designationId: true,
  departmentId: true,
  teamId: true,
  managerId: true,
  avatarUrl: true,
  dateOfJoining: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  officeLocationId: true,
  officeLocation: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeSelect;
```

Update `listEmployees` signature to accept a `role` param and use the appropriate select:
```typescript
export async function listEmployees(
  orgId: string,
  query: EmployeeListQuery,
  prisma: PrismaClient,
  role?: string,
) {
  const selectFields = role === 'MANAGER' ? EMPLOYEE_SELECT_REDACTED : EMPLOYEE_SELECT;
  // ... rest unchanged, but use selectFields instead of EMPLOYEE_SELECT
}
```

Update the route to pass role:
```typescript
const result = await listEmployees(req.user.orgId, query, app.prisma, req.user.role);
```

Also update `GET /employees/:id` with the same role-gated select:
```typescript
app.get('/employees/:id', auth, async (req, reply) => {
  if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
    throw fail('Forbidden', 403);
  }
  const { id } = req.params as { id: string };
  const employee = await getEmployee(id, req.user.orgId, app.prisma, req.user.role);
  return reply.send(ok(employee));
});
```

Update `getEmployee` in the service the same way.

---

### BUG-C02 — POST /employees, PATCH /employees/:id, DELETE /employees/:id have no role authorization

**File:** `apps/api/src/modules/employees/employee.routes.ts`

**Root cause:**
- `POST /employees` (create) — no role check; any EMPLOYEE can create new accounts
- `DELETE /employees/:id` (soft-delete) — no role check; any EMPLOYEE can delete any colleague
- `PATCH /employees/:id` — only blocks `workEmail` for non-admin; EMPLOYEE can still
  update another employee's bank account, PAN, designation, department, etc.

**Fix — apply the following changes to employee.routes.ts:**

```typescript
// POST /employees — require HR+ role
app.post('/employees', auth, async (req, reply) => {
  // ADD:
  if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role)) {
    throw fail('Forbidden — only HR can create employees', 403);
  }
  const input = createEmployeeSchema.parse(req.body);
  const employee = await createEmployee(req.user.orgId, input, app.prisma);
  return reply.status(201).send(ok(employee));
});

// DELETE /employees/:id — require HR+ role
app.delete('/employees/:id', auth, async (req, reply) => {
  // ADD:
  if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role)) {
    throw fail('Forbidden — only HR can delete employees', 403);
  }
  const { id } = req.params as { id: string };
  await softDeleteEmployee(id, req.user.orgId, app.prisma);
  return reply.status(204).send();
});

// PATCH /employees/:id — role-aware edit
app.patch('/employees/:id', auth, async (req, reply) => {
  const { id } = req.params as { id: string };
  const input = updateEmployeeSchema.parse(req.body);

  const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role);
  const isManager = req.user.role === 'MANAGER';
  const isEmployee = req.user.role === 'EMPLOYEE';

  // EMPLOYEE role: can only edit their own record
  if (isEmployee && id !== req.user.sub) {
    throw fail('Forbidden — you can only edit your own profile', 403);
  }

  // MANAGER role: can only edit self or direct reports
  if (isManager && id !== req.user.sub) {
    const isDirect = await app.prisma.employee.findFirst({
      where: { id, managerId: req.user.sub, organizationId: req.user.orgId, deletedAt: null },
    });
    if (!isDirect) throw fail('Forbidden — you can only edit your direct reports', 403);
  }

  // Non-admin roles cannot change workEmail
  if (!isAdmin) {
    delete input.workEmail;
  }

  // Non-admin/non-manager roles cannot change role, status, departmentId, managerId
  if (!isAdmin && !isManager) {
    delete (input as Record<string, unknown>).status;
    delete (input as Record<string, unknown>).departmentId;
    delete (input as Record<string, unknown>).managerId;
    delete (input as Record<string, unknown>).designationId;
  }

  const employee = await updateEmployee(id, req.user.orgId, input, app.prisma);
  return reply.send(ok(employee));
});
```

---

### BUG-C03 — PATCH /leaves/:id/approve has no role check; any user can approve any leave

**File:** `apps/api/src/modules/leaves/leave.routes.ts` (line ~325)

**Root cause:**
The approve endpoint only verifies the request belongs to the org and is PENDING.
Any EMPLOYEE can self-approve or approve/reject any colleague's leave.

**Fix — add role and direct-report check at the start of the handler:**

```typescript
app.patch('/leaves/:id/approve', auth, async (req, reply) => {
  const { id } = req.params as { id: string };
  const input = approveLeaveSchema.parse(req.body);

  // ADD: Only managers and above can approve leaves
  const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];
  if (!APPROVER_ROLES.includes(req.user.role)) {
    throw fail('Forbidden — only managers can approve leave requests', 403);
  }

  const request = await app.prisma.leaveRequest.findFirst({
    where: { id, organizationId: req.user.orgId, deletedAt: null },
    include: {
      employee: { select: { id: true, firstName: true, workEmail: true } },
      leaveType: { select: { isPaid: true } },
    },
  });

  if (!request) throw fail('Leave request not found', 404);
  if (request.status !== 'PENDING') throw fail('Only pending requests can be actioned', 400);

  // ADD: Managers can only approve their direct reports' leaves
  if (req.user.role === 'MANAGER') {
    const isDirectReport = await app.prisma.employee.findFirst({
      where: {
        id: request.employeeId,
        managerId: req.user.sub,
        organizationId: req.user.orgId,
        deletedAt: null,
      },
    });
    if (!isDirectReport) {
      throw fail('Forbidden — you can only approve your direct reports\' leaves', 403);
    }
  }

  // ... rest of the handler unchanged (the $transaction block)
```

---

### BUG-C04 — Leave type CRUD and leave balance management have no role checks

**File:** `apps/api/src/modules/leaves/leave.routes.ts`

**Root cause:**
Five endpoints have only `app.authenticate` but need HR-level authorization:
1. `POST /leave-types` — any user can create leave types with 365 days allowed
2. `PATCH /leave-types/:id` — any user can increase daysAllowed
3. `DELETE /leave-types/:id` — any user can delete leave types
4. `POST /leaves/balance/upsert` — any user can set anyone's balance to any number
5. `POST /leaves/balance/initialize` — any user can reinitialize all balances

**Fix — add this block at the top of each handler (before any DB call):**

```typescript
// For ALL five handlers listed above:
if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role)) {
  throw fail('Forbidden', 403);
}
```

Specific handlers to add the check to:
- `app.post('/leave-types', ...)` — add before `leaveTypeBodySchema.parse`
- `app.patch('/leave-types/:id', ...)` — add before `leaveTypeBodySchema.partial().parse`
- `app.delete('/leave-types/:id', ...)` — add before the DB update
- `app.post('/leaves/balance/upsert', ...)` — add before the zod parse
- `app.post('/leaves/balance/initialize', ...)` — add before the zod parse

Note: `POST /leaves/balance/carry-forward` already has the correct check — use it as the reference pattern.

---

### BUG-C05 — GET /leaves/balances exposes all employees' leave data with no role gate

**File:** `apps/api/src/modules/leaves/leave.routes.ts` (line ~597)

**Root cause:**
`GET /leaves/balances` returns all employees' leave allocations, used days, and
pending days. No role check. Any EMPLOYEE can read everyone's leave data.

**Fix — add at the top of the handler:**
```typescript
app.get('/leaves/balances', auth, async (req, reply) => {
  // ADD:
  if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role)) {
    throw fail('Forbidden', 403);
  }
  // ... rest unchanged
```

---

## HIGH SEVERITY BUGS — FIX BEFORE FIRST REAL USER

---

### BUG-H01 — Super admin login is not rate-limited (brute-forceable)

**File:** `apps/api/src/modules/super-admin/super-admin.routes.ts` (line ~21)

**Root cause:**
Regular auth routes use `authRateLimit` (5 attempts / 15 min per IP+email).
The super admin login at `POST /super-admin/auth/login` has no rate limit config,
allowing unlimited password guesses against the highest-privilege account.

**Fix:**
The `authRateLimit` config is defined inside `auth.routes.ts`. Extract it to a
shared location or duplicate it inside `super-admin.routes.ts`.

Option A — Extract to a shared file `apps/api/src/lib/rate-limits.ts`:
```typescript
import type { FastifyRequest } from 'fastify';

export const authRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
      keyGenerator: (req: FastifyRequest) => {
        const email = (req.body as Record<string, unknown>)?.['email'] as string | undefined;
        return email ? `auth:${req.ip}:${email.toLowerCase()}` : `auth:${req.ip}`;
      },
    },
  },
};

// Stricter limit for super admin
export const superAdminRateLimit = {
  config: {
    rateLimit: {
      max: 3,
      timeWindow: '30 minutes',
      keyGenerator: (req: FastifyRequest) => `superauth:${req.ip}`,
    },
  },
};
```

Then in `super-admin.routes.ts`:
```typescript
import { superAdminRateLimit } from '../../lib/rate-limits.js';

// Change:
app.post('/super-admin/auth/login', async (req, reply) => {
// To:
app.post('/super-admin/auth/login', superAdminRateLimit, async (req, reply) => {
```

Also update `auth.routes.ts` to import from the shared file instead of defining inline.

---

### BUG-H02 — File upload MIME type check is client-controlled; actual file content not validated

**File:** `apps/api/src/modules/upload/upload.routes.ts` (line ~59)

**Root cause:**
`data.mimetype` comes from the multipart Content-Type header, which the client
controls. An attacker can rename `malware.html` → `malware.pdf`, set the header
to `application/pdf`, and upload it. Cloudinary uses `resource_type: 'raw'` for
documents which accepts any content.

**Fix — install `file-type` and validate magic bytes:**

Step 1: Install the package:
```
pnpm add file-type --filter @hrms/api
```

Step 2: Update `upload.routes.ts`:
```typescript
import { fileTypeFromBuffer } from 'file-type';

// In the route handler, after `const buffer = await data.toBuffer();`, ADD:
const detected = await fileTypeFromBuffer(buffer);
const effectiveMime = detected?.mime ?? data.mimetype;

// Replace the existing MIME check:
if (!ALLOWED_MIME_TYPES.has(effectiveMime)) {
  throw fail(
    `File content type '${effectiveMime}' is not allowed. ` +
    `Permitted types: JPEG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX`,
    400,
  );
}

if (folder === 'avatars' && !AVATAR_MIME_TYPES.has(effectiveMime)) {
  throw fail('Avatar uploads must be image files (JPEG, PNG, WEBP, GIF)', 400);
}
```

This validates the actual file content (magic bytes) rather than the client-supplied
header, making it impossible to disguise one file type as another.

---

### BUG-H03 — Payroll processing race condition: concurrent requests double-process the same run

**File:** `apps/api/src/modules/payroll/payroll.service.ts` (lines ~56–67)

**Root cause:**
Two concurrent POST requests to `/payroll/runs/:id/process` both read `status === 'DRAFT'`,
both pass the check, and both set `status = 'PROCESSING'`. Both proceed to
compute and write payslips, with the second overwriting the first's data.

**Fix — use atomic compare-and-swap:**

Replace:
```typescript
const run = await prisma.payrollRun.findFirst({
  where: { id: payrollRunId, organizationId: orgId },
  include: { organization: true },
});
if (!run) throw fail('Payroll run not found', 404);
if (run.status !== 'DRAFT') throw fail('Only DRAFT payroll runs can be processed', 400);

await prisma.payrollRun.update({
  where: { id: payrollRunId },
  data: { status: 'PROCESSING' },
});
```

With:
```typescript
// First, verify the run exists and belongs to this org
const runCheck = await prisma.payrollRun.findFirst({
  where: { id: payrollRunId, organizationId: orgId },
  include: { organization: true },
});
if (!runCheck) throw fail('Payroll run not found', 404);
if (runCheck.status !== 'DRAFT') throw fail('Only DRAFT payroll runs can be processed', 400);

// Atomic CAS: only succeeds if status is still DRAFT at this exact moment
const locked = await prisma.payrollRun.updateMany({
  where: { id: payrollRunId, organizationId: orgId, status: 'DRAFT' },
  data: { status: 'PROCESSING' },
});
if (locked.count === 0) {
  throw fail('Payroll run is already being processed by another request', 409);
}

// Re-fetch with organization include (needed below)
const run = await prisma.payrollRun.findUniqueOrThrow({
  where: { id: payrollRunId },
  include: { organization: true },
});
```

---

### BUG-H04 — Room bookings have no overlap/conflict detection

**File:** `apps/api/src/modules/rooms/room.routes.ts`

**Root cause:**
No query exists to check for conflicting bookings before creating one. Two users
can book the same room for the same time slot simultaneously.

**Fix — add conflict check in the booking creation handler:**

```typescript
// In the POST /rooms/bookings (or wherever bookings are created) handler,
// BEFORE creating the booking, ADD:

const conflictingBooking = await app.prisma.roomBooking.findFirst({
  where: {
    roomId: input.roomId,
    organizationId: req.user.orgId,
    status: 'CONFIRMED',
    AND: [
      { startTime: { lt: new Date(input.endTime) } },
      { endTime: { gt: new Date(input.startTime) } },
    ],
  },
});
if (conflictingBooking) {
  throw fail(
    'This room is already booked for the requested time slot. Please choose a different time.',
    409,
  );
}
```

Also add basic input validation:
```typescript
const start = new Date(input.startTime);
const end = new Date(input.endTime);
if (end <= start) throw fail('End time must be after start time', 400);
if (start < new Date()) throw fail('Cannot book a room in the past', 400);
```

---

### BUG-H05 — Payroll bulk transaction times out for large organizations (500+ employees)

**File:** `apps/api/src/modules/payroll/payroll.service.ts` (line ~262)

**Root cause:**
```typescript
await prisma.$transaction([
  ...payslipOps,  // N upserts — one per employee
  prisma.payrollRun.update(...),
]);
```
Prisma's array-form `$transaction` has a default 5-second timeout. With 500+
employees, each with a full upsert, this will consistently timeout in production.

**Fix — switch to interactive transaction with chunked batches:**

Replace the entire final transaction block with:
```typescript
await prisma.$transaction(
  async (tx) => {
    const CHUNK_SIZE = 50;
    for (let i = 0; i < payslipOps.length; i += CHUNK_SIZE) {
      const chunk = payslipOps.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((op) =>
          tx.payslip.upsert({
            where: op.where,
            update: op.update,
            create: op.create,
          } as Parameters<typeof tx.payslip.upsert>[0]),
        ),
      );
    }
    await tx.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: 'COMPLETED',
        totalEmployees: processedCount,
        totalGross,
        totalDeductions,
        totalNetPay,
        processedBy,
        processedAt: new Date(),
      },
    });
  },
  { timeout: 120_000 }, // 2-minute timeout for large orgs
);
```

NOTE: You will need to restructure `payslipOps` to store the upsert arguments
directly (where/update/create objects) rather than calling `prisma.payslip.upsert()`
during the build phase — since those calls must now run inside the `tx` context.

Refactor the accumulation loop:
```typescript
interface PayslipUpsertArgs {
  where: { organizationId_payrollRunId_employeeId: { organizationId: string; payrollRunId: string; employeeId: string } };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}
const payslipArgs: PayslipUpsertArgs[] = [];

// Inside the per-employee loop, replace:
// payslipOps.push(prisma.payslip.upsert({ where, update, create }))
// With:
payslipArgs.push({ where: { organizationId_payrollRunId_employeeId: { organizationId: orgId, payrollRunId, employeeId: emp.id } }, create: payslipData, update: payslipData });
```

---

### BUG-H06 — IDOR: any authenticated EMPLOYEE can update another employee's sensitive fields

**File:** `apps/api/src/modules/employees/employee.routes.ts` (PATCH /employees/:id)

**Root cause:**
The PATCH endpoint only removes `workEmail` from the update payload for non-admin
roles. It does not verify that `id === req.user.sub` for EMPLOYEE role. Combined
with BUG-C01 (all employee UUIDs visible), any employee can change a colleague's
bank account, PAN, department, designation, etc.

**Fix:** Already covered in BUG-C02 fix above (the updated PATCH handler includes
self-vs-other and direct-report checks). Ensure BUG-C02 fix is applied completely.

---

## MEDIUM SEVERITY BUGS — FIX BEFORE SCALE

---

### BUG-M01 — Mixed LOCAL/UTC date construction in payroll causes off-by-one day in non-UTC timezones

**File:** `apps/api/src/modules/payroll/payroll.service.ts` (lines ~70–71)

**Root cause:**
```typescript
// Lines 70-71 — LOCAL timezone (wrong)
const monthStart = new Date(run.year, run.month - 1, 1);
const monthEnd   = new Date(run.year, run.month, 0);
```
These use the JS `Date` constructor with local time. On a UTC+5:30 server, this
creates dates that differ from UTC midnight. DB `@db.Date` fields are stored as
UTC dates. This can cause the payroll to include the last day of the previous
month or exclude the first day of the current month.

The cursor on line 133 correctly uses `Date.UTC(...)` — the surrounding queries
must match.

**Fix — use UTC throughout:**
```typescript
// Replace lines 70-71 with:
const monthStart = new Date(Date.UTC(run.year, run.month - 1, 1));
const monthEnd   = new Date(Date.UTC(run.year, run.month, 0, 23, 59, 59, 999));
const daysInMonth = new Date(Date.UTC(run.year, run.month, 0)).getUTCDate();
```

Also update the Prisma query boundaries:
```typescript
prisma.attendanceRecord.findMany({
  where: {
    organizationId: orgId,
    date: { gte: monthStart, lte: monthEnd },
  },
}),
```

---

### BUG-M02 — Payroll silently skips employees without salary revision; no warning returned

**File:** `apps/api/src/modules/payroll/payroll.service.ts` (line ~155)

**Root cause:**
```typescript
if (!revision) continue; // No salary structure — skip silently
```
The API returns `{ totalEmployees: processedCount }` but never tells HR who was
skipped. New joiners added without a salary structure will be excluded from every
payroll run indefinitely and HR will not know.

**Fix:**

Add a `skippedEmployees` array in the service:
```typescript
const skippedEmployees: Array<{ id: string; employeeCode: string; firstName: string; lastName: string }> = [];

// Replace:
// if (!revision) continue;
// With:
if (!revision) {
  skippedEmployees.push({
    id: emp.id,
    employeeCode: emp.employeeCode,
    firstName: emp.firstName,
    lastName: emp.lastName,
  });
  continue;
}
```

Update the function return type and value:
```typescript
// At the bottom of processPayrollRun, change return to:
const completedRun = await prisma.payrollRun.findUniqueOrThrow({ where: { id: payrollRunId } });
return { run: completedRun, skippedEmployees };
```

Update the payroll route to surface this in the API response:
```typescript
// In payroll.routes.ts, POST /payroll/runs/:id/process:
const result = await processPayrollRun(req.user.orgId, id, req.user.sub, app.prisma);
return reply.send(ok(result));
// result = { run: {...}, skippedEmployees: [...] }
```

---

### BUG-M03 — Dashboard birthday query loads all employees into memory for JS-level filtering

**File:** `apps/api/src/modules/dashboard/dashboard.routes.ts` (line ~60)

**Root cause:**
```typescript
const empWithDob = await app.prisma.employee.findMany({
  where: { organizationId: orgId, deletedAt: null, status: 'ACTIVE', dateOfBirth: { not: null } },
  // Returns ALL employees — could be 1000+ records
});
// Then filters in JS:
.filter((e) => e.daysUntil <= 6)
```
Every dashboard page load fetches all employees and filters in Node.js.

**Fix — use raw SQL for month+day comparison:**
```typescript
// Replace the empWithDob block with:
const today = new Date();
const todayMonth = today.getUTCMonth() + 1; // 1-indexed
const todayDay = today.getUTCDate();

// Build a 7-day window of (month, day) pairs
const upcomingDays: Array<{ month: number; day: number; daysUntil: number }> = [];
for (let offset = 0; offset <= 6; offset++) {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + offset));
  upcomingDays.push({ month: d.getUTCMonth() + 1, day: d.getUTCDate(), daysUntil: offset });
}

const birthdays = await app.prisma.$queryRaw<
  Array<{ id: string; firstName: string; lastName: string; designation: string | null; avatarUrl: string | null; dateOfBirth: Date; daysUntil: number }>
>`
  SELECT
    e.id, e."firstName", e."lastName", e.designation, e."avatarUrl", e."dateOfBirth",
    CASE
      ${upcomingDays.map((d) => `WHEN EXTRACT(MONTH FROM e."dateOfBirth") = ${d.month} AND EXTRACT(DAY FROM e."dateOfBirth") = ${d.day} THEN ${d.daysUntil}`).join(' ')}
      ELSE 99
    END AS "daysUntil"
  FROM employees e
  WHERE e."organizationId" = ${orgId}
    AND e."deletedAt" IS NULL
    AND e.status = 'ACTIVE'
    AND e."dateOfBirth" IS NOT NULL
    AND (
      ${upcomingDays.map((d) => `(EXTRACT(MONTH FROM e."dateOfBirth") = ${d.month} AND EXTRACT(DAY FROM e."dateOfBirth") = ${d.day})`).join(' OR ')}
    )
  ORDER BY "daysUntil" ASC
`;
```

---

### BUG-M04 — Leave carry-forward array transaction times out for large organizations

**File:** `apps/api/src/modules/leaves/leave.routes.ts` (line ~745)

**Root cause:**
Same pattern as BUG-H05. The carry-forward builds one upsert per
employee-leaveType combination in an array transaction. For 500 employees ×
5 carry-forward types = 2500 operations — will timeout.

**Fix — switch to chunked interactive transaction:**
```typescript
// Replace:
await app.prisma.$transaction(
  fromBalances.flatMap((balance) => { ... return [prisma.leaveBalance.upsert(...)]; }),
);

// With:
// First collect all upsert args
interface UpsertArgs { where: object; update: object; create: object }
const upsertArgs: UpsertArgs[] = [];

for (const balance of fromBalances) {
  const leaveType = leaveTypes.find((lt) => lt.id === balance.leaveTypeId);
  if (!leaveType) continue;
  const remaining = Math.max(0, balance.allocated - balance.used - balance.pending);
  const carryDays = Math.min(remaining, leaveType.maxCarryForward);
  if (carryDays === 0) continue;

  records++;
  totalDaysCarried += carryDays;

  upsertArgs.push({
    where: {
      organizationId_employeeId_leaveTypeId_year: {
        organizationId: req.user.orgId,
        employeeId: balance.employeeId,
        leaveTypeId: balance.leaveTypeId,
        year: toYear,
      },
    },
    update: { allocated: { increment: carryDays } },
    create: {
      organizationId: req.user.orgId,
      employeeId: balance.employeeId,
      leaveTypeId: balance.leaveTypeId,
      year: toYear,
      allocated: leaveType.daysAllowed + carryDays,
    },
  });
}

// Execute in chunks inside an interactive transaction
const CHUNK = 100;
await app.prisma.$transaction(
  async (tx) => {
    for (let i = 0; i < upsertArgs.length; i += CHUNK) {
      await Promise.all(
        upsertArgs.slice(i, i + CHUNK).map((args) =>
          tx.leaveBalance.upsert(args as Parameters<typeof tx.leaveBalance.upsert>[0]),
        ),
      );
    }
  },
  { timeout: 60_000 },
);
```

---

### BUG-M05 — sortBy query parameter accepted but silently ignored in all paginated routes

**File:** `apps/api/src/lib/pagination.ts` (line ~7)

**Root cause:**
`paginationSchema` accepts `sortBy` but `paginationArgs()` only returns `skip`
and `take`. The `sortBy` field is parsed and then thrown away. Every route
hardcodes its own `orderBy`, making column-sort UI features non-functional.

**Fix — Option A (remove the field to avoid confusion):**
```typescript
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20), // Also cap at 100 (see BUG-L02)
  search: z.string().optional(),
  // Remove sortBy and sortOrder — each route defines its own orderBy
});
```

**Fix — Option B (make it work):**
```typescript
// In pagination.ts, add a sortable helper:
export function buildOrderBy(
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc',
  allowedFields: string[],
  defaultField = 'createdAt',
): Record<string, string> {
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { [field]: sortOrder };
}
```
Then each route explicitly calls `buildOrderBy(query.sortBy, query.sortOrder, ['firstName', 'createdAt', 'status'])`.

Option A is recommended unless the frontend actively uses sortBy.

---

### BUG-M06 — Self-service bank detail update has no verification step before affecting payroll

**File:** `apps/api/src/modules/employees/employee.routes.ts` (line ~109)

**Root cause:**
`PATCH /employees/me/profile` persists bank detail changes immediately. The next
payroll run uses whatever account is in the DB. If an attacker hijacks a session
(e.g., left-open browser), they can redirect an employee's entire salary.

**Fix — add an HR notification on bank detail change:**
```typescript
// In PATCH /employees/me/profile, after the prisma.employee.update call, ADD:

const bankFields = ['bankAccountNumber', 'bankIfsc', 'bankName', 'bankBranch'];
const hasBankChange = bankFields.some((f) => f in input);

if (hasBankChange) {
  // Notify HR about the bank detail change
  await app.prisma.notification.create({
    data: {
      organizationId: req.user.orgId,
      // Find the HR admin to notify (or use a system notification)
      employeeId: req.user.sub, // notify the employee themselves as confirmation
      type: 'SYSTEM',
      title: 'Bank Details Updated',
      body: 'Your bank details have been updated. If you did not make this change, contact HR immediately.',
    },
  });
  // TODO (longer-term): Add OTP/approval flow for bank changes
}
```

---

## LOW SEVERITY BUGS

---

### BUG-L01 — Super admin session expires in 15 minutes with no refresh mechanism

**File:** `apps/api/src/modules/super-admin/super-admin.routes.ts`

**Root cause:**
Super admin login returns only a 15-minute access token with no refresh token.
After 15 minutes, every API call returns 401. There is no `/super-admin/auth/refresh`
and the super admin store likely has no interceptor for 401s.

**Fix — either:**
Option A (quick): Increase super admin access token TTL to 4h in the sign call:
```typescript
const accessToken = signAccessToken({ sub: admin.id, orgId: 'super', role: 'SUPER_ADMIN' });
// Change signAccessToken to accept an optional TTL override, or use jwt.sign directly:
const accessToken = jwt.sign(
  { sub: admin.id, orgId: 'super', role: 'SUPER_ADMIN' },
  env.JWT_SECRET,
  { expiresIn: '4h' },
);
```

Option B (proper): Implement a refresh flow for super admin using a separate Redis key.

---

### BUG-L02 — Pagination limit allows 500 records; should be capped lower

**File:** `apps/api/src/lib/pagination.ts` (line ~5)

**Root cause:**
`limit: z.coerce.number().int().min(1).max(500).default(20)` allows clients to
request 500 records per page. For employee queries with 30+ fields including
JSON blobs (addresses, education), this can return 10+ MB per request.

**Fix:**
```typescript
// Change max(500) to max(100):
limit: z.coerce.number().int().min(1).max(100).default(20),
```

For specific endpoints that need higher limits (like report generation), accept
a separate `pageSize` parameter with explicit documentation.

---

### BUG-L03 — PasswordResetToken has no index on employeeId

**File:** `apps/api/prisma/schema.prisma` (PasswordResetToken model, line ~1527)

**Root cause:**
`forgot-password` runs `updateMany({ where: { employeeId: employee.id, usedAt: null } })`.
Without an index on `employeeId`, this is a full table scan as the token table grows.

**Fix — add index to schema:**
```prisma
model PasswordResetToken {
  id         String    @id @default(uuid())
  employeeId String
  token      String    @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime  @default(now())

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])   // ADD THIS LINE
  @@map("password_reset_tokens")
}
```

Then run: `pnpm --filter @hrms/api prisma migrate dev --name "add_password_reset_token_employee_index"`

---

### BUG-L04 — Anonymous suggestion box may leak employeeId to admins in API response

**File:** `apps/api/src/modules/suggestions/suggestion.routes.ts`

**Root cause:**
`SuggestionBox.employeeId` is always stored in DB. If the GET /suggestions
endpoint returns raw DB rows for admins, the anonymous user is identified.
Need to verify and fix if the employeeId is included in the response for
anonymous suggestions.

**Fix — in the suggestions list handler, mask employeeId when isAnonymous:**
```typescript
// In the GET /suggestions (or equivalent) handler:
const suggestions = await app.prisma.suggestionBox.findMany({ ... });

return reply.send(ok(
  suggestions.map((s) => ({
    ...s,
    // Mask identity for anonymous suggestions (even from HR)
    employeeId: s.isAnonymous ? null : s.employeeId,
    employee: s.isAnonymous ? null : s.employee,
  }))
));
```

Note: Only SUPER_ADMIN should ever see the real identity behind an anonymous
suggestion, and only if legally required. For normal HR use, anonymity must
be preserved.

---

## ADDITIONAL CODE QUALITY FIXES

---

### QUALITY-01 — plan-guard makes a DB round-trip on every guarded request

**File:** `apps/api/src/lib/plan-guard.ts`

**Issue:** Every request to a plan-gated endpoint queries `organizations` for
the current plan. This adds one extra DB query to every gated API call.

**Fix — cache the org plan in Redis with a short TTL:**
```typescript
export function requirePlan(minPlan: OrgPlan) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const orgId = req.user?.orgId;
    if (!orgId) return reply.status(401).send({ ... });

    // Try Redis cache first
    const redis = (req.server as { redis: FastifyRedis }).redis;
    const cacheKey = `org:plan:${orgId}`;
    let plan: OrgPlan | null = null;

    const cached = await redis.get(cacheKey);
    if (cached) {
      plan = cached as OrgPlan;
    } else {
      const prisma = (req.server as { prisma: PrismaClient }).prisma;
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true },
      });
      plan = org?.plan ?? null;
      if (plan) {
        await redis.setex(cacheKey, 300, plan); // Cache for 5 minutes
      }
    }

    const rank = plan != null ? (PLAN_RANK[plan] ?? -1) : -1;
    if (rank < PLAN_RANK[minPlan]) {
      return reply.status(402).send({ ... });
    }
  };
}
```

When a plan is upgraded/downgraded via super admin, invalidate the cache:
```typescript
// In super-admin.routes.ts, after updating the plan:
await app.redis.del(`org:plan:${id}`);
```

---

### QUALITY-02 — Attendance date range filter uses local time for @db.Date comparison

**File:** `apps/api/src/modules/attendance/attendance.routes.ts`

**Issue:**
```typescript
const from = new Date(year, month - 1, 1);  // Local time
const to = new Date(year, month, 0);         // Local time
```
These should use UTC to match how `@db.Date` values are stored.

**Fix:**
```typescript
const from = new Date(Date.UTC(year, month - 1, 1));
const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
```
Apply the same fix to `GET /attendance/summary/:employeeId`.

---

### QUALITY-03 — Expense status filter uses `as any` type cast (type safety gap)

**File:** `apps/api/src/modules/expenses/expense.routes.ts` (line ~47)

**Issue:**
```typescript
...(qs.status ? { status: qs.status as any } : {}),
```
The `as any` bypasses TypeScript's enum validation. Invalid status values like
`"HACKED"` would be passed to Prisma and fail at runtime instead of at validation.

**Fix — add Zod validation to the HR list endpoint query:**
```typescript
const EXPENSE_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'] as const;
const querySchema = z.object({
  status: z.enum(EXPENSE_STATUSES).optional(),
  employeeId: z.string().uuid().optional(),
});
const qs = querySchema.parse(req.query);
// Now status is typed as ExpenseStatus | undefined — no `as any` needed
```

---

## PRISMA SCHEMA CHANGES REQUIRED

The following schema changes need `prisma migrate dev` runs after code changes:

```
1. Add @@index([employeeId]) to PasswordResetToken   (BUG-L03)
```

Run:
```bash
cd apps/api
pnpm prisma migrate dev --name "qa_fixes_indexes"
```

No other schema changes are needed for the above fixes — all other changes
are in application code only.

---

## IMPLEMENTATION ORDER (recommended)

Apply fixes in this sequence to minimize risk and get maximum security coverage first:

```
Phase 1 — Critical (security blockers, ~3 hours):
  1. BUG-C01 — Employee list role gate + redacted select
  2. BUG-C02 — Employee write role gates
  3. BUG-C03 — Leave approval role gate + direct-report check
  4. BUG-C04 — Leave type + balance role gates (5 handlers)
  5. BUG-C05 — Leave balances list role gate
  6. BUG-H01 — Super admin rate limiting

Phase 2 — High (data + reliability, ~4 hours):
  7.  BUG-H02 — MIME magic-bytes validation (requires npm install)
  8.  BUG-H03 — Payroll race condition (atomic CAS)
  9.  BUG-H04 — Room booking conflict detection
  10. BUG-H05 — Payroll chunked transaction
  11. BUG-H06 — Already covered by BUG-C02 fix; verify it's complete

Phase 3 — Medium (correctness + scale, ~3 hours):
  12. BUG-M01 — UTC date fix in payroll
  13. BUG-M02 — Payroll skip warning
  14. BUG-M03 — Dashboard birthday query optimization
  15. BUG-M04 — Carry-forward chunked transaction
  16. BUG-M05 — Remove or implement sortBy
  17. BUG-M06 — Bank detail change notification

Phase 4 — Low + Quality (~2 hours):
  18. BUG-L01 — Super admin session TTL
  19. BUG-L02 — Pagination limit cap at 100
  20. BUG-L03 — PasswordResetToken index + migration
  21. BUG-L04 — Suggestion box anonymity masking
  22. QUALITY-01 — Plan guard Redis cache
  23. QUALITY-02 — Attendance UTC date fix
  24. QUALITY-03 — Expense status type safety
```

---

## REGRESSION TESTS TO RUN AFTER EACH PHASE

### After Phase 1 (Security):
- [ ] EMPLOYEE role cannot call GET /employees → expect 403
- [ ] EMPLOYEE role cannot call POST /employees → expect 403
- [ ] EMPLOYEE role cannot call DELETE /employees/:id → expect 403
- [ ] EMPLOYEE role cannot approve leave → expect 403
- [ ] EMPLOYEE role cannot create/edit/delete leave types → expect 403
- [ ] EMPLOYEE role cannot call POST /leaves/balance/upsert → expect 403
- [ ] EMPLOYEE role cannot call GET /leaves/balances → expect 403
- [ ] HR role CAN call all of the above → expect 200/201
- [ ] MANAGER role CAN call GET /employees → expect 200 with PAN/Aadhaar stripped
- [ ] EMPLOYEE role CAN call GET /employees/me → expect 200
- [ ] EMPLOYEE role CAN call PATCH /employees/me/profile → expect 200
- [ ] EMPLOYEE role CANNOT call PATCH /employees/<other-id> → expect 403
- [ ] Super admin login brute-force: 4 attempts → 200, 5th → 429

### After Phase 2 (Data + Reliability):
- [ ] Upload file renamed to .pdf but containing HTML → expect 400
- [ ] Upload valid JPEG → expect 200
- [ ] Two concurrent payroll process requests → one 200, one 409
- [ ] Book same room for overlapping time → expect 409 on second
- [ ] Book room with end before start → expect 400
- [ ] Payroll run for 10 employees completes (sanity check after refactor)

### After Phase 3 (Correctness):
- [ ] Payroll run month/year boundaries: check January (month=1) and December (month=12)
- [ ] Employee without salary revision → run completes, response includes skippedEmployees array
- [ ] Dashboard loads in < 500ms for a 200-employee org
- [ ] Carry-forward runs to completion for large dataset
- [ ] Leave balance upsert with sortBy param → same result as without

### After Phase 4 (Low/Quality):
- [ ] Super admin session remains valid after 15 minutes (if TTL extended)
- [ ] GET /employees?limit=500 → rejected (if cap applied) or returns max 100
- [ ] Forgot password for active user → updateMany on tokens runs fast (indexed)
- [ ] Anonymous suggestion response hides employeeId in API response

---

## VERIFICATION COMMANDS

```bash
# Type-check the entire API after changes:
cd apps/api && pnpm tsc --noEmit

# Type-check the web app:
cd apps/web && pnpm tsc --noEmit

# Run existing tests:
pnpm test

# Run Prisma migrations (after schema changes):
cd apps/api && pnpm prisma migrate dev

# Regenerate Prisma client after schema changes:
cd apps/api && pnpm prisma generate
```

---

## WHAT THE NEXT SESSION SHOULD DO

When you receive this file, do the following:

1. Read this file fully first.
2. Read each source file listed in the fix before editing it — never edit blind.
3. Apply fixes in Phase 1 → Phase 2 → Phase 3 → Phase 4 order.
4. After each fix, run `pnpm tsc --noEmit` for the affected app to confirm no type errors.
5. Do not add any feature beyond what is described in each fix section.
6. Do not refactor surrounding code — make the smallest correct change.
7. After all fixes, run the verification commands above.
8. Report which bugs were fixed, which were skipped (and why), and any new issues found while editing.
