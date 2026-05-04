// ============================================================
// @hrms/shared-types
// TypeScript types shared between web (React) and api (Fastify)
// ALL domain types must be defined here — never duplicated
// ============================================================

// ─────────────────────────────────────────────────────────────
// Enums & Unions
// ─────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'WFH'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'WEEKEND'
  | 'PENDING'; // Punch-in done, punch-out not yet

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type LeaveCategory = 'PAID' | 'UNPAID' | 'COMPENSATORY';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'PROBATION';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_NOTICE' | 'TERMINATED' | 'ABSCONDED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type SalaryComponentType = 'EARNING' | 'DEDUCTION' | 'STATUTORY';

export type SalaryCalculationType =
  | 'FIXED'
  | 'PERCENTAGE_OF_BASIC'
  | 'PERCENTAGE_OF_CTC'
  | 'PERCENTAGE_OF_GROSS'
  | 'FORMULA';

export type PayrollStatus = 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'PAID' | 'FAILED';

export type DocumentType =
  | 'OFFER_LETTER'
  | 'APPOINTMENT_LETTER'
  | 'ID_PROOF'
  | 'ADDRESS_PROOF'
  | 'EDUCATION_CERTIFICATE'
  | 'EXPERIENCE_LETTER'
  | 'PAYSLIP'
  | 'FORM_16'
  | 'PF_STATEMENT'
  | 'OTHER';

export type NotificationType =
  | 'LEAVE_APPLIED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'ATTENDANCE_REMINDER'
  | 'PAYSLIP_GENERATED'
  | 'ANNOUNCEMENT'
  | 'BIRTHDAY'
  | 'WORK_ANNIVERSARY';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';

// ─────────────────────────────────────────────────────────────
// India-specific
// ─────────────────────────────────────────────────────────────

export type IndiaState =
  | 'AN'
  | 'AP'
  | 'AR'
  | 'AS'
  | 'BR'
  | 'CG'
  | 'CH'
  | 'DN'
  | 'DD'
  | 'DL'
  | 'GA'
  | 'GJ'
  | 'HR'
  | 'HP'
  | 'JK'
  | 'JH'
  | 'KA'
  | 'KL'
  | 'LA'
  | 'LD'
  | 'MP'
  | 'MH'
  | 'MN'
  | 'ML'
  | 'MZ'
  | 'NL'
  | 'OD'
  | 'PY'
  | 'PB'
  | 'RJ'
  | 'SK'
  | 'TN'
  | 'TS'
  | 'TR'
  | 'UP'
  | 'UK'
  | 'WB';

// ─────────────────────────────────────────────────────────────
// API Response Envelope
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string; // userId
  orgId: string; // organizationId (multi-tenancy)
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  organizationSlug?: string;
}

export interface LoginResponse {
  tokens: AuthTokens;
  employee: EmployeeSummary;
  organization: OrganizationSummary;
}

// ─────────────────────────────────────────────────────────────
// Organization (Tenant)
// ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  domain?: string;
  timezone: string;
  country: string;
  state?: IndiaState;
  city?: string;
  address?: string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  pfRegistrationNumber?: string;
  esiRegistrationNumber?: string;
  ptRegistrationNumber?: string;
  financialYearStart: number; // Month (1-12), India = 4 (April)
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type OrganizationSummary = Pick<
  Organization,
  'id' | 'name' | 'slug' | 'logo' | 'timezone' | 'financialYearStart'
>;

// ─────────────────────────────────────────────────────────────
// Department & Team
// ─────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  headId?: string;
  parentId?: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  organizationId: string;
  departmentId: string;
  name: string;
  leadId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Employee
// ─────────────────────────────────────────────────────────────

export interface EmployeeAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface EmployeeEmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface EmployeeEducation {
  degree?: string;
  institution?: string;
  year?: number;
}

export interface EmployeeExperience {
  totalYears?: number;
  lastCompany?: string;
  lastDesignation?: string;
}

export interface Employee {
  id: string;
  organizationId: string;
  employeeCode: string;
  userId?: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  workEmail?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  maritalStatus?: string;
  dateOfBirth?: string;
  dateOfJoining?: string;
  dateOfConfirmation?: string;
  dateOfTermination?: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  designation?: string;
  location?: string;
  presentAddress?: EmployeeAddress;
  permanentAddress?: EmployeeAddress;
  emergencyContact?: EmployeeEmergencyContact;
  educationDetails?: EmployeeEducation;
  experienceDetails?: EmployeeExperience;
  panNumber?: string;
  aadhaarNumber?: string;
  pfAccountNumber?: string;
  esiNumber?: string;
  uanNumber?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  bankBranch?: string;
  noticePeriodDays?: number;
  department?: { id: string; name: string };
  manager?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export type EmployeeSummary = Pick<
  Employee,
  | 'id'
  | 'employeeCode'
  | 'firstName'
  | 'lastName'
  | 'displayName'
  | 'avatar'
  | 'designation'
  | 'role'
>;

// ─────────────────────────────────────────────────────────────
// Shift
// ─────────────────────────────────────────────────────────────

export interface Shift {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string; // "HH:mm" in 24hr format
  endTime: string; // "HH:mm" in 24hr format
  graceMinutes: number; // Late arrival buffer
  halfDayAfterMinutes: number; // Mark half-day if late by this many minutes
  absentAfterMinutes: number; // Mark absent if late by this many minutes
  breakDurationMinutes: number;
  isNightShift: boolean; // Crosses midnight
  weeklyOffDays: number[]; // 0=Sunday, 6=Saturday
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────────

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  shiftId?: string;
  date: string; // "YYYY-MM-DD"
  punchIn?: string; // ISO 8601 UTC
  punchOut?: string; // ISO 8601 UTC
  status: AttendanceStatus;
  punchInLocation?: GeoLocation;
  punchOutLocation?: GeoLocation;
  punchInPhoto?: string; // Cloudinary URL
  workingMinutes?: number;
  overtimeMinutes?: number;
  lateMinutes?: number;
  isManuallyEdited: boolean;
  editReason?: string;
  editedBy?: string;
  notes?: string;
  employee?: EmployeeSummary;
  shift?: Shift;
  createdAt: string;
  updatedAt: string;
}

export interface PunchInRequest {
  location?: GeoLocation;
  photo?: string; // Base64 or Cloudinary URL
  deviceId?: string;
  notes?: string;
}

export interface PunchOutRequest {
  location?: GeoLocation;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────
// Leave
// ─────────────────────────────────────────────────────────────

export interface LeaveType {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: LeaveCategory;
  daysAllowedPerYear: number;
  maxCarryForwardDays: number;
  minNoticeDays: number; // Minimum advance notice required
  maxConsecutiveDays: number; // 0 = unlimited
  isHalfDayAllowed: boolean;
  isSandwichApplicable: boolean; // Weekends between leave dates count
  isPaidLeave: boolean;
  isActive: boolean;
  applicableGenders?: Gender[];
  color: string; // Hex color for calendar display
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: Pick<LeaveType, 'name' | 'code' | 'color' | 'category'>;
  year: number;
  allocated: number;
  carryForward: number;
  used: number;
  pending: number;
  available: number; // allocated + carryForward - used - pending
}

export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  isHalfDay: boolean;
  halfDaySession?: 'MORNING' | 'AFTERNOON';
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  cancelledAt?: string;
  cancelReason?: string;
  attachmentUrl?: string;
  approvals: LeaveApproval[];
  employee?: EmployeeSummary;
  leaveType?: Pick<LeaveType, 'name' | 'code' | 'color'>;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveApproval {
  id: string;
  leaveRequestId: string;
  approverId: string;
  level: number;
  status: ApprovalStatus;
  comment?: string;
  decidedAt?: string;
  approver?: EmployeeSummary;
}

// ─────────────────────────────────────────────────────────────
// Payroll & Salary
// ─────────────────────────────────────────────────────────────

export interface SalaryComponent {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: SalaryComponentType;
  calculationType: SalaryCalculationType;
  value: number;
  isTaxable: boolean;
  isStatutory: boolean;
  statutoryCode?: 'PF' | 'ESI' | 'PT' | 'LWF' | 'TDS' | 'GRATUITY';
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  id: string;
  organizationId: string;
  name: string;
  ctc: number;
  basic: number;
  components: SalaryStructureComponent[];
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructureComponent {
  componentId: string;
  component: SalaryComponent;
  value: number; // Resolved value (calculated if formula-based)
  monthlyAmount: number;
  annualAmount: number;
}

export interface PayrollRun {
  id: string;
  organizationId: string;
  month: number; // 1-12
  year: number;
  status: PayrollStatus;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  processedAt?: string;
  paidAt?: string;
  processedBy?: string;
  payslips?: Payslip[];
  createdAt: string;
  updatedAt: string;
}

export interface Payslip {
  id: string;
  organizationId: string;
  payrollRunId: string;
  employeeId: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  lopDays: number;
  earnings: PayslipLineItem[];
  deductions: PayslipLineItem[];
  statutory: PayslipLineItem[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  pdfUrl?: string;
  employee?: EmployeeSummary;
  createdAt: string;
}

export interface PayslipLineItem {
  componentId: string;
  name: string;
  code: string;
  type: SalaryComponentType;
  amount: number;
}

// ─────────────────────────────────────────────────────────────
// WebSocket Events
// ─────────────────────────────────────────────────────────────

export interface WsEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: string; // ISO 8601
  organizationId: string;
}

export type WsAttendancePunchIn = WsEvent<{
  employeeId: string;
  employeeName: string;
  avatar?: string;
  designation?: string;
  punchInTime: string;
  location?: GeoLocation;
  photo?: string;
}>;

export type WsAttendancePunchOut = WsEvent<{
  employeeId: string;
  employeeName: string;
  punchOutTime: string;
  workingMinutes: number;
}>;

export type WsNotification = WsEvent<{
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}>;
