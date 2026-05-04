import { z } from 'zod';
import { isValidPAN, isValidAadhaar, isValidIFSC, isValidIndianMobile } from '@hrms/shared-utils';
import { paginationSchema } from '../../lib/pagination.js';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  workEmail: z.string().email(),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || isValidIndianMobile(v), {
      message: 'Invalid Indian mobile number',
    }),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  employmentType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT'])
    .default('FULL_TIME'),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  dateOfJoining: z.string().datetime().optional(),
  noticePeriodDays: z.number().int().min(0).default(30),
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
  // Initial password
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ password: true, workEmail: true })
  .partial();

export const employeeListSchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE', 'TERMINATED', 'ABSCONDED']).optional(),
  departmentId: z.string().uuid().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeListQuery = z.infer<typeof employeeListSchema>;
