import { z } from 'zod';
import { isValidPAN, isValidAadhaar, isValidIFSC, isValidPhone } from '@hrms/shared-utils';
import { paginationSchema } from '../../lib/pagination.js';

const addressSchema = z
  .object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('IN'),
  })
  .optional();

const emergencyContactSchema = z
  .object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  })
  .optional();

const educationDetailsSchema = z
  .array(z.object({
    degree: z.string().optional(),
    institution: z.string().optional(),
    year: z.number().int().optional(),
    grade: z.string().optional(),
  }))
  .optional();

const experienceDetailsSchema = z
  .array(z.object({
    totalYears: z.number().optional(),
    lastCompany: z.string().optional(),
    lastDesignation: z.string().optional(),
  }))
  .optional();

export const createEmployeeSchema = z.object({
  // Personal
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || isValidPhone(v), { message: 'Invalid phone number — use international format, e.g. +91 98765 43210' }),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  bloodGroup: z.string().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  // Employment
  workEmail: z.string().email(),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT'])
    .default('FULL_TIME'),
  designation: z.string().max(100).optional(),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  dateOfJoining: z.string().datetime().optional(),
  noticePeriodDays: z.number().int().min(0).default(30),
  // Address & Emergency
  presentAddress: addressSchema,
  permanentAddress: addressSchema,
  emergencyContact: emergencyContactSchema,
  // Education & Experience
  educationDetails: educationDetailsSchema,
  experienceDetails: experienceDetailsSchema,
  // India statutory
  panNumber: z
    .string()
    .optional()
    .refine((v) => !v || isValidPAN(v), { message: 'Invalid PAN number' }),
  aadhaarNumber: z
    .string()
    .optional()
    .refine((v) => !v || isValidAadhaar(v), { message: 'Invalid Aadhaar number' }),
  pfAccountNumber: z.string().optional(),
  esiNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  // Bank
  bankAccountNumber: z.string().optional(),
  bankIfsc: z
    .string()
    .optional()
    .refine((v) => !v || isValidIFSC(v), { message: 'Invalid IFSC code' }),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  // Avatar
  avatarUrl: z.string().url().optional(),
  // Account
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ password: true })
  .partial()
  // Remove the default(30) so partial updates don't silently overwrite the existing value
  .extend({
    noticePeriodDays: z.number().int().min(0).optional(),
    biometricPreference: z
      .enum(['FINGERPRINT_FIRST', 'FACE_FIRST', 'BIOMETRIC_ANY', 'NO_BIOMETRIC'])
      .optional(),
  });

export const employeeListSchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE', 'TERMINATED', 'ABSCONDED']).optional(),
  departmentId: z.string().uuid().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeListQuery = z.infer<typeof employeeListSchema>;
