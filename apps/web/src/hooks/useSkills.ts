import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

// ── Types ────────────────────────────────────────────────────────────────────

export type SkillCategory = 'TECHNICAL' | 'SOFT_SKILL' | 'DOMAIN' | 'CERTIFICATION' | 'LANGUAGE' | 'TOOL';
export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  isActive: boolean;
  _count?: { employeeSkills: number };
}

export interface EmployeeSkill {
  id: string;
  employeeId: string;
  skillId: string;
  skill: Skill;
  proficiency: SkillProficiency;
  yearsOfExperience?: number;
  lastUsedYear?: number;
  certificationUrl?: string;
  isVerified: boolean;
  verifiedById?: string;
  verifiedAt?: string;
  notes?: string;
  verifiedBy?: { id: string; firstName: string; lastName: string };
}

export interface MatrixRow {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: string;
    avatarUrl?: string;
    department?: { name: string };
  };
  skills: {
    skillId: string;
    skillName: string;
    category: SkillCategory;
    proficiency: SkillProficiency;
    yearsOfExperience?: number;
    isVerified: boolean;
  }[];
}

export interface SkillsSummary {
  totalSkills: number;
  totalTagged: number;
  verifiedCount: number;
}

// ── Skill Catalog ────────────────────────────────────────────────────────────

export function useSkills(category?: string) {
  return useQuery<Skill[]>({
    queryKey: ['skills', category],
    queryFn: async () => {
      const params = category ? `?category=${category}` : '';
      const { data } = await api.get(`/skills${params}`);
      return data.data;
    },
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Skill>) => api.post('/skills', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...rest }: Partial<Skill> & { id: string }) =>
      api.patch(`/skills/${id}`, rest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/skills/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });
}

// ── My Skills ────────────────────────────────────────────────────────────────

export function useMySkills() {
  return useQuery<EmployeeSkill[]>({
    queryKey: ['my-skills'],
    queryFn: async () => {
      const { data } = await api.get('/skills/my-skills');
      return data.data;
    },
  });
}

export function useAddMySkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      skillId: string;
      proficiency: SkillProficiency;
      yearsOfExperience?: number;
      lastUsedYear?: number;
      certificationUrl?: string;
      notes?: string;
    }) => api.post('/skills/my-skills', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-skills'] });
      qc.invalidateQueries({ queryKey: ['skills-matrix'] });
    },
  });
}

export function useDeleteMySkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => api.delete(`/skills/my-skills/${skillId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-skills'] });
      qc.invalidateQueries({ queryKey: ['skills-matrix'] });
    },
  });
}

// ── Employee Skills (HR/Manager view) ────────────────────────────────────────

export function useEmployeeSkills(employeeId: string | null) {
  return useQuery<EmployeeSkill[]>({
    queryKey: ['employee-skills', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/skills/employees/${employeeId}`);
      return data.data;
    },
    enabled: !!employeeId,
  });
}

export function useVerifySkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, skillId }: { employeeId: string; skillId: string }) =>
      api.patch(`/skills/verify/${employeeId}/${skillId}`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skills-matrix'] });
      qc.invalidateQueries({ queryKey: ['employee-skills'] });
    },
  });
}

// ── Skills Matrix ────────────────────────────────────────────────────────────

export function useSkillsMatrix(params?: { skillId?: string; category?: string; search?: string }) {
  return useQuery<MatrixRow[]>({
    queryKey: ['skills-matrix', params],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params?.skillId) q.set('skillId', params.skillId);
      if (params?.category) q.set('category', params.category);
      if (params?.search) q.set('search', params.search);
      const { data } = await api.get(`/skills/matrix?${q}`);
      return data.data;
    },
  });
}

// GET /skills/search?skillId=&proficiency=
export function useSearchBySkill(skillId: string | null, proficiency?: string) {
  return useQuery<EmployeeSkill[]>({
    queryKey: ['skill-search', skillId, proficiency],
    queryFn: async () => {
      const q = new URLSearchParams({ skillId: skillId! });
      if (proficiency) q.set('proficiency', proficiency);
      const { data } = await api.get(`/skills/search?${q}`);
      return data.data;
    },
    enabled: !!skillId,
  });
}

// ── Summary ──────────────────────────────────────────────────────────────────

export function useSkillsSummary() {
  return useQuery<SkillsSummary>({
    queryKey: ['skills-summary'],
    queryFn: async () => {
      const { data } = await api.get('/skills/summary');
      return data.data;
    },
  });
}
