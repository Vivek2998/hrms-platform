# HRMS Database Schema

> Managed by Prisma migrations. Never modify the database directly.
> Schema file: `apps/api/prisma/schema.prisma`

## Design Principles

1. **Multi-tenancy**: Every table has `organizationId` with Row-Level Security (RLS)
2. **Soft deletes**: All major tables have `deletedAt` — never hard delete
3. **Audit trail**: Salary, attendance, and leave changes are immutably logged
4. **UTC timestamps**: All stored in UTC, displayed in org's configured timezone
5. **India-first**: Schema includes PF, ESI, TDS, PT fields from day 1

## Core Model Hierarchy

```
SuperAdmin
└── Organizations (Tenants)
    ├── Departments
    │   └── Teams
    │       └── Employees (Users)
    │           ├── ShiftAssignments → Shifts
    │           ├── AttendanceRecords
    │           ├── LeaveRequests → LeaveApprovals
    │           ├── SalaryRevisions → SalaryComponents
    │           ├── PayrollRuns → Payslips
    │           └── Documents
    ├── LeaveTypes (per organization)
    ├── SalaryComponents (per organization)
    ├── Holidays (per organization)
    └── Announcements
```

## Key Tables

### employees

- `id`, `organizationId`, `userId`, `employeeCode`
- `firstName`, `lastName`, `displayName`, `email`, `workEmail`
- `role`, `status`, `employmentType`
- `departmentId`, `teamId`, `managerId`
- `panNumber`, `aadhaarNumber`, `pfAccountNumber`, `esiNumber`
- `bankAccountNumber`, `bankIfsc`, `bankName`
- `dateOfJoining`, `dateOfConfirmation`, `dateOfTermination`
- `deletedAt`, `createdAt`, `updatedAt`

### attendance_records

- `id`, `organizationId`, `employeeId`, `shiftId`
- `date` (date only, no time)
- `punchIn`, `punchOut` (full UTC timestamps)
- `status` (PRESENT/ABSENT/LATE/HALF_DAY/WFH/ON_LEAVE/HOLIDAY)
- `punchInLocation`, `punchOutLocation` (JSON: lat/lng/accuracy/address)
- `punchInPhoto` (Cloudinary URL)
- `workingMinutes`, `overtimeMinutes`, `lateMinutes`
- `isManuallyEdited`, `editReason`, `editedBy`

### shifts

- `id`, `organizationId`, `name`, `code`
- `startTime`, `endTime` (HH:mm strings)
- `graceMinutes`, `halfDayAfterMinutes`, `absentAfterMinutes`
- `breakDurationMinutes`, `isNightShift`
- `weeklyOffDays` (JSON array of day numbers: 0=Sun)

### salary_revisions

- `id`, `organizationId`, `employeeId`
- `effectiveFrom`, `effectiveTo` (for history)
- `ctc`, `basic`, `gross`, `netPay`
- `components` (JSON: array of component values)
- `reason`, `approvedBy`
- Immutable — never updated, only new rows inserted

### payroll_runs

- `id`, `organizationId`, `month`, `year`
- `status` (DRAFT/PROCESSING/COMPLETED/PAID/FAILED)
- `totalEmployees`, `totalGross`, `totalDeductions`, `totalNetPay`

### payslips

- `id`, `organizationId`, `payrollRunId`, `employeeId`
- `month`, `year`, `workingDays`, `presentDays`, `lopDays`
- `earnings`, `deductions`, `statutory` (JSON arrays)
- `grossEarnings`, `totalDeductions`, `netPay`
- `pdfUrl` (Cloudinary URL)
