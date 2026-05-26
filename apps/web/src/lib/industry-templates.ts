export type IndustryType =
  | 'IT_SOFTWARE'
  | 'MANUFACTURING'
  | 'HEALTHCARE'
  | 'FINANCIAL_SERVICES'
  | 'RETAIL'
  | 'EDUCATIONAL'
  | 'SERVICE_BASED'
  | 'GENERAL';

export const INDUSTRY_LABELS: Record<IndustryType, string> = {
  IT_SOFTWARE:        'IT / Software',
  MANUFACTURING:      'Manufacturing',
  HEALTHCARE:         'Healthcare / Hospital',
  FINANCIAL_SERVICES: 'Financial Services / Banking',
  RETAIL:             'Retail / E-Commerce',
  EDUCATIONAL:        'Educational Institution',
  SERVICE_BASED:      'Service Based Company',
  GENERAL:            'General / Other',
};

export interface TemplatePosition {
  key: string;             // stable ID within this template (e.g. "ceo", "vp_eng")
  title: string;           // display name / designation label
  parentKey: string | null;
  department?: string;
  level: number;           // 1 = top, higher = deeper
}

const IT_SOFTWARE: TemplatePosition[] = [
  { key: 'ceo',         title: 'Chief Executive Officer',      parentKey: null,         department: 'Leadership',    level: 1 },
  { key: 'cto',         title: 'Chief Technology Officer',     parentKey: 'ceo',        department: 'Engineering',   level: 2 },
  { key: 'coo',         title: 'Chief Operating Officer',      parentKey: 'ceo',        department: 'Operations',    level: 2 },
  { key: 'cfo',         title: 'Chief Financial Officer',      parentKey: 'ceo',        department: 'Finance',       level: 2 },
  { key: 'vp_eng',      title: 'VP Engineering',               parentKey: 'cto',        department: 'Engineering',   level: 3 },
  { key: 'vp_product',  title: 'VP Product',                   parentKey: 'cto',        department: 'Product',       level: 3 },
  { key: 'eng_mgr',     title: 'Engineering Manager',          parentKey: 'vp_eng',     department: 'Engineering',   level: 4 },
  { key: 'tech_lead',   title: 'Tech Lead',                    parentKey: 'eng_mgr',    department: 'Engineering',   level: 5 },
  { key: 'sr_dev',      title: 'Senior Software Engineer',     parentKey: 'tech_lead',  department: 'Engineering',   level: 6 },
  { key: 'developer',   title: 'Software Engineer',            parentKey: 'sr_dev',     department: 'Engineering',   level: 7 },
  { key: 'qa_lead',     title: 'QA Lead',                      parentKey: 'eng_mgr',    department: 'QA',            level: 5 },
  { key: 'qa_eng',      title: 'QA Engineer',                  parentKey: 'qa_lead',    department: 'QA',            level: 6 },
  { key: 'devops',      title: 'DevOps Engineer',              parentKey: 'eng_mgr',    department: 'DevOps',        level: 5 },
  { key: 'pm',          title: 'Product Manager',              parentKey: 'vp_product', department: 'Product',       level: 4 },
  { key: 'designer',    title: 'UI/UX Designer',               parentKey: 'vp_product', department: 'Design',        level: 4 },
  { key: 'hr_head',     title: 'Head of HR',                   parentKey: 'coo',        department: 'HR',            level: 3 },
  { key: 'hr_mgr',      title: 'HR Manager',                   parentKey: 'hr_head',    department: 'HR',            level: 4 },
  { key: 'hr_exec',     title: 'HR Executive',                 parentKey: 'hr_mgr',     department: 'HR',            level: 5 },
  { key: 'ops_head',    title: 'Head of Operations',           parentKey: 'coo',        department: 'Operations',    level: 3 },
  { key: 'ops_mgr',     title: 'Operations Manager',           parentKey: 'ops_head',   department: 'Operations',    level: 4 },
  { key: 'finance_mgr', title: 'Finance Manager',              parentKey: 'cfo',        department: 'Finance',       level: 3 },
  { key: 'accountant',  title: 'Accountant',                   parentKey: 'finance_mgr',department: 'Finance',       level: 4 },
];

const MANUFACTURING: TemplatePosition[] = [
  { key: 'md',           title: 'Managing Director',            parentKey: null,          department: 'Leadership',    level: 1 },
  { key: 'dir_ops',      title: 'Director Operations',          parentKey: 'md',          department: 'Operations',    level: 2 },
  { key: 'dir_fin',      title: 'Director Finance',             parentKey: 'md',          department: 'Finance',       level: 2 },
  { key: 'dir_hr',       title: 'Director HR',                  parentKey: 'md',          department: 'HR',            level: 2 },
  { key: 'plant_mgr',    title: 'Plant Manager',                parentKey: 'dir_ops',     department: 'Operations',    level: 3 },
  { key: 'sc_mgr',       title: 'Supply Chain Manager',         parentKey: 'dir_ops',     department: 'Supply Chain',  level: 3 },
  { key: 'prod_mgr',     title: 'Production Manager',           parentKey: 'plant_mgr',   department: 'Production',    level: 4 },
  { key: 'maint_mgr',    title: 'Maintenance Manager',          parentKey: 'plant_mgr',   department: 'Maintenance',   level: 4 },
  { key: 'quality_mgr',  title: 'Quality Manager',              parentKey: 'plant_mgr',   department: 'Quality',       level: 4 },
  { key: 'shift_sup',    title: 'Shift Supervisor',             parentKey: 'prod_mgr',    department: 'Production',    level: 5 },
  { key: 'operator',     title: 'Line Operator',                parentKey: 'shift_sup',   department: 'Production',    level: 6 },
  { key: 'maint_tech',   title: 'Maintenance Technician',       parentKey: 'maint_mgr',   department: 'Maintenance',   level: 5 },
  { key: 'qc_sup',       title: 'QC Supervisor',                parentKey: 'quality_mgr', department: 'Quality',       level: 5 },
  { key: 'qc_inspector', title: 'QC Inspector',                 parentKey: 'qc_sup',      department: 'Quality',       level: 6 },
  { key: 'proc_mgr',     title: 'Procurement Manager',          parentKey: 'sc_mgr',      department: 'Supply Chain',  level: 4 },
  { key: 'wh_mgr',       title: 'Warehouse Manager',            parentKey: 'sc_mgr',      department: 'Supply Chain',  level: 4 },
  { key: 'finance_mgr',  title: 'Finance Manager',              parentKey: 'dir_fin',     department: 'Finance',       level: 3 },
  { key: 'accounts_mgr', title: 'Accounts Manager',             parentKey: 'finance_mgr', department: 'Finance',       level: 4 },
  { key: 'hr_mgr',       title: 'HR Manager',                   parentKey: 'dir_hr',      department: 'HR',            level: 3 },
  { key: 'hr_exec',      title: 'HR Executive',                 parentKey: 'hr_mgr',      department: 'HR',            level: 4 },
];

const HEALTHCARE: TemplatePosition[] = [
  { key: 'ceo',           title: 'CEO / Hospital Director',    parentKey: null,           department: 'Leadership',    level: 1 },
  { key: 'cmo',           title: 'Chief Medical Officer',      parentKey: 'ceo',          department: 'Medical',       level: 2 },
  { key: 'coo',           title: 'Chief Operating Officer',    parentKey: 'ceo',          department: 'Administration',level: 2 },
  { key: 'cfo',           title: 'Chief Financial Officer',    parentKey: 'ceo',          department: 'Finance',       level: 2 },
  { key: 'head_surgery',  title: 'Head of Surgery',            parentKey: 'cmo',          department: 'Surgery',       level: 3 },
  { key: 'head_medicine', title: 'Head of Medicine',           parentKey: 'cmo',          department: 'Medicine',      level: 3 },
  { key: 'head_nursing',  title: 'Head of Nursing',            parentKey: 'cmo',          department: 'Nursing',       level: 3 },
  { key: 'sr_surgeon',    title: 'Senior Surgeon',             parentKey: 'head_surgery', department: 'Surgery',       level: 4 },
  { key: 'surgeon',       title: 'Surgeon',                    parentKey: 'sr_surgeon',   department: 'Surgery',       level: 5 },
  { key: 'sr_consultant', title: 'Senior Consultant',          parentKey: 'head_medicine',department: 'Medicine',      level: 4 },
  { key: 'med_officer',   title: 'Medical Officer',            parentKey: 'sr_consultant',department: 'Medicine',      level: 5 },
  { key: 'sr_nurse',      title: 'Senior Nurse',               parentKey: 'head_nursing', department: 'Nursing',       level: 4 },
  { key: 'nurse',         title: 'Staff Nurse',                parentKey: 'sr_nurse',     department: 'Nursing',       level: 5 },
  { key: 'med_supt',      title: 'Medical Superintendent',     parentKey: 'coo',          department: 'Administration',level: 3 },
  { key: 'admin',         title: 'Hospital Administrator',     parentKey: 'coo',          department: 'Administration',level: 4 },
  { key: 'finance_mgr',   title: 'Finance Manager',            parentKey: 'cfo',          department: 'Finance',       level: 3 },
  { key: 'hr_mgr',        title: 'HR Manager',                 parentKey: 'coo',          department: 'HR',            level: 3 },
];

const FINANCIAL_SERVICES: TemplatePosition[] = [
  { key: 'ceo',           title: 'CEO / Managing Director',    parentKey: null,           department: 'Leadership',         level: 1 },
  { key: 'cro',           title: 'Chief Risk Officer',         parentKey: 'ceo',          department: 'Risk',               level: 2 },
  { key: 'head_retail',   title: 'Head – Retail Banking',      parentKey: 'ceo',          department: 'Retail Banking',     level: 2 },
  { key: 'head_ops',      title: 'Head – Operations',          parentKey: 'ceo',          department: 'Operations',         level: 2 },
  { key: 'cfo',           title: 'Chief Financial Officer',    parentKey: 'ceo',          department: 'Finance',            level: 2 },
  { key: 'hr_head',       title: 'Head – HR',                  parentKey: 'ceo',          department: 'HR',                 level: 2 },
  { key: 'risk_mgr',      title: 'Risk Manager',               parentKey: 'cro',          department: 'Risk',               level: 3 },
  { key: 'branch_mgr',    title: 'Branch Manager',             parentKey: 'head_retail',  department: 'Retail Banking',     level: 3 },
  { key: 'sales_mgr',     title: 'Sales Manager',              parentKey: 'head_retail',  department: 'Sales',              level: 3 },
  { key: 'rm',            title: 'Relationship Manager',       parentKey: 'branch_mgr',   department: 'Retail Banking',     level: 4 },
  { key: 'branch_officer',title: 'Branch Officer',             parentKey: 'branch_mgr',   department: 'Retail Banking',     level: 4 },
  { key: 'sales_officer', title: 'Sales Officer',              parentKey: 'sales_mgr',    department: 'Sales',              level: 4 },
  { key: 'ops_mgr',       title: 'Operations Manager',         parentKey: 'head_ops',     department: 'Operations',         level: 3 },
  { key: 'finance_mgr',   title: 'Finance Manager',            parentKey: 'cfo',          department: 'Finance',            level: 3 },
  { key: 'hr_mgr',        title: 'HR Manager',                 parentKey: 'hr_head',      department: 'HR',                 level: 3 },
];

const RETAIL: TemplatePosition[] = [
  { key: 'ceo',            title: 'CEO / Managing Director',   parentKey: null,            department: 'Leadership',    level: 1 },
  { key: 'vp_ops',         title: 'VP Retail Operations',      parentKey: 'ceo',           department: 'Operations',    level: 2 },
  { key: 'vp_marketing',   title: 'VP Marketing',              parentKey: 'ceo',           department: 'Marketing',     level: 2 },
  { key: 'vp_sc',          title: 'VP Supply Chain',           parentKey: 'ceo',           department: 'Supply Chain',  level: 2 },
  { key: 'cfo',            title: 'Chief Financial Officer',   parentKey: 'ceo',           department: 'Finance',       level: 2 },
  { key: 'regional_mgr',   title: 'Regional Manager',          parentKey: 'vp_ops',        department: 'Operations',    level: 3 },
  { key: 'vm_head',        title: 'Visual Merchandising Head', parentKey: 'vp_ops',        department: 'Visual',        level: 3 },
  { key: 'store_mgr',      title: 'Store Manager',             parentKey: 'regional_mgr',  department: 'Retail',        level: 4 },
  { key: 'asst_store_mgr', title: 'Assistant Store Manager',   parentKey: 'store_mgr',     department: 'Retail',        level: 5 },
  { key: 'sales_associate',title: 'Sales Associate',           parentKey: 'asst_store_mgr',department: 'Retail',        level: 6 },
  { key: 'vm',             title: 'Visual Merchandiser',       parentKey: 'vm_head',       department: 'Visual',        level: 4 },
  { key: 'mktg_mgr',       title: 'Marketing Manager',         parentKey: 'vp_marketing',  department: 'Marketing',     level: 3 },
  { key: 'digital_mktg',   title: 'Digital Marketing Manager', parentKey: 'mktg_mgr',      department: 'Marketing',     level: 4 },
  { key: 'sc_mgr',         title: 'Supply Chain Manager',      parentKey: 'vp_sc',         department: 'Supply Chain',  level: 3 },
  { key: 'inv_mgr',        title: 'Inventory Manager',         parentKey: 'sc_mgr',        department: 'Supply Chain',  level: 4 },
  { key: 'finance_mgr',    title: 'Finance Manager',           parentKey: 'cfo',           department: 'Finance',       level: 3 },
];

const EDUCATIONAL: TemplatePosition[] = [
  { key: 'principal',    title: 'Principal / Director',        parentKey: null,          department: 'Leadership',    level: 1 },
  { key: 'vice_prin',    title: 'Vice Principal',              parentKey: 'principal',   department: 'Academic',      level: 2 },
  { key: 'admin_head',   title: 'Administrative Head',         parentKey: 'principal',   department: 'Administration',level: 2 },
  { key: 'sports_head',  title: 'Head – Sports & Activities',  parentKey: 'principal',   department: 'Sports',        level: 2 },
  { key: 'acad_coord',   title: 'Academic Coordinator',        parentKey: 'vice_prin',   department: 'Academic',      level: 3 },
  { key: 'exam_ctrl',    title: 'Examination Controller',      parentKey: 'vice_prin',   department: 'Examination',   level: 3 },
  { key: 'hod_science',  title: 'Head of Dept – Science',      parentKey: 'acad_coord',  department: 'Science',       level: 4 },
  { key: 'hod_maths',    title: 'Head of Dept – Mathematics',  parentKey: 'acad_coord',  department: 'Mathematics',   level: 4 },
  { key: 'hod_arts',     title: 'Head of Dept – Arts',         parentKey: 'acad_coord',  department: 'Arts',          level: 4 },
  { key: 'hod_commerce', title: 'Head of Dept – Commerce',     parentKey: 'acad_coord',  department: 'Commerce',      level: 4 },
  { key: 'teacher_sci',  title: 'Teacher – Science',           parentKey: 'hod_science', department: 'Science',       level: 5 },
  { key: 'teacher_math', title: 'Teacher – Mathematics',       parentKey: 'hod_maths',   department: 'Mathematics',   level: 5 },
  { key: 'exam_coord',   title: 'Examination Coordinator',     parentKey: 'exam_ctrl',   department: 'Examination',   level: 4 },
  { key: 'accounts_mgr', title: 'Accounts Manager',            parentKey: 'admin_head',  department: 'Accounts',      level: 3 },
  { key: 'admin_officer',title: 'Administrative Officer',      parentKey: 'admin_head',  department: 'Administration',level: 3 },
  { key: 'librarian',    title: 'Librarian',                   parentKey: 'admin_head',  department: 'Library',       level: 3 },
  { key: 'sports_coach', title: 'Sports Coach',                parentKey: 'sports_head', department: 'Sports',        level: 3 },
];

const SERVICE_BASED: TemplatePosition[] = [
  { key: 'ceo',          title: 'CEO / Managing Director',     parentKey: null,           department: 'Leadership',        level: 1 },
  { key: 'vp_delivery',  title: 'VP Delivery',                 parentKey: 'ceo',          department: 'Delivery',          level: 2 },
  { key: 'vp_sales',     title: 'VP Sales & Marketing',        parentKey: 'ceo',          department: 'Sales',             level: 2 },
  { key: 'cfo',          title: 'Chief Financial Officer',     parentKey: 'ceo',          department: 'Finance',           level: 2 },
  { key: 'hr_head',      title: 'Head of HR',                  parentKey: 'ceo',          department: 'HR',                level: 2 },
  { key: 'delivery_mgr', title: 'Delivery Manager',            parentKey: 'vp_delivery',  department: 'Delivery',          level: 3 },
  { key: 'pm',           title: 'Project Manager',             parentKey: 'vp_delivery',  department: 'Project Management',level: 3 },
  { key: 'sr_consultant',title: 'Senior Consultant',           parentKey: 'delivery_mgr', department: 'Consulting',        level: 4 },
  { key: 'consultant',   title: 'Consultant',                  parentKey: 'sr_consultant',department: 'Consulting',        level: 5 },
  { key: 'ba',           title: 'Business Analyst',            parentKey: 'pm',           department: 'Business Analysis', level: 4 },
  { key: 'sales_mgr',    title: 'Sales Manager',               parentKey: 'vp_sales',     department: 'Sales',             level: 3 },
  { key: 'bde',          title: 'Business Development Exec',   parentKey: 'sales_mgr',    department: 'Sales',             level: 4 },
  { key: 'mktg_mgr',     title: 'Marketing Manager',           parentKey: 'vp_sales',     department: 'Marketing',         level: 3 },
  { key: 'finance_mgr',  title: 'Finance Manager',             parentKey: 'cfo',          department: 'Finance',           level: 3 },
  { key: 'hr_mgr',       title: 'HR Manager',                  parentKey: 'hr_head',      department: 'HR',                level: 3 },
  { key: 'hr_exec',      title: 'HR Executive',                parentKey: 'hr_mgr',       department: 'HR',                level: 4 },
];

const GENERAL: TemplatePosition[] = [
  { key: 'ceo',        title: 'CEO / Managing Director',       parentKey: null,         department: 'Leadership',    level: 1 },
  { key: 'coo',        title: 'Chief Operating Officer',       parentKey: 'ceo',        department: 'Operations',    level: 2 },
  { key: 'cfo',        title: 'Chief Financial Officer',       parentKey: 'ceo',        department: 'Finance',       level: 2 },
  { key: 'dir_hr',     title: 'Director HR',                   parentKey: 'ceo',        department: 'HR',            level: 2 },
  { key: 'ops_mgr',    title: 'Operations Manager',            parentKey: 'coo',        department: 'Operations',    level: 3 },
  { key: 'team_lead',  title: 'Team Lead',                     parentKey: 'ops_mgr',    department: 'Operations',    level: 4 },
  { key: 'sr_exec',    title: 'Senior Executive',              parentKey: 'team_lead',  department: 'Operations',    level: 5 },
  { key: 'executive',  title: 'Executive',                     parentKey: 'sr_exec',    department: 'Operations',    level: 6 },
  { key: 'finance_mgr',title: 'Finance Manager',               parentKey: 'cfo',        department: 'Finance',       level: 3 },
  { key: 'accountant', title: 'Accountant',                    parentKey: 'finance_mgr',department: 'Finance',       level: 4 },
  { key: 'hr_mgr',     title: 'HR Manager',                    parentKey: 'dir_hr',     department: 'HR',            level: 3 },
  { key: 'hr_exec',    title: 'HR Executive',                  parentKey: 'hr_mgr',     department: 'HR',            level: 4 },
];

export const INDUSTRY_TEMPLATES: Record<IndustryType, TemplatePosition[]> = {
  IT_SOFTWARE:        IT_SOFTWARE,
  MANUFACTURING:      MANUFACTURING,
  HEALTHCARE:         HEALTHCARE,
  FINANCIAL_SERVICES: FINANCIAL_SERVICES,
  RETAIL:             RETAIL,
  EDUCATIONAL:        EDUCATIONAL,
  SERVICE_BASED:      SERVICE_BASED,
  GENERAL:            GENERAL,
};
