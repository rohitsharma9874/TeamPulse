export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  department: string;
  phone: string;
  photo: string;
  // Hierarchy
  reportsTo?: string;
  // Demographic
  designation?: string;
  gender?: string;
  dateOfBirth?: string;
  joinDate?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  phone?: string;
  photoUrl?: string;
  // Hierarchy
  reportsTo?: string;
  // Demographic
  designation?: string;
  gender?: string;
  dateOfBirth?: string;
  joinDate?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  department?: string;
  phone?: string;
  photoUrl?: string;
  newPassword?: string;
  // Hierarchy
  reportsTo?: string;
  // Demographic
  designation?: string;
  gender?: string;
  dateOfBirth?: string;
  joinDate?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 0,
  admin: 1,
  'sub-admin': 2,
  'senior-manager': 3,
  senior_manager_audit: 3,
  senior_manager_compliance: 3,
  manager_audit: 4,
  manager_audit_accounts: 4,
  manager_compliance_legal: 4,
  associate: 5,
  associate_audit_accounts: 5,
  associate_compliance_legal: 5,
  audit_associate: 6,
  audit_compliance_associate: 6,
  executive: 7,
  executive_audit_accounts: 7,
  executive_compliance_legal: 7,
  assistant: 8,
  audit_assistant: 8,
  compliance_assistant: 8,
  trainee: 9,
};

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  'sub-admin': 'Sub Admin',
  'senior-manager': 'Senior Manager',
  senior_manager_audit: 'Sr. Manager Audit',
  senior_manager_compliance: 'Sr. Manager Compliance',
  manager_audit: 'Manager Audit',
  manager_audit_accounts: 'Manager Audit & Accounts',
  manager_compliance_legal: 'Manager Compliance & Legal',
  associate: 'Associate',
  associate_audit_accounts: 'Associate Audit & Accounts',
  associate_compliance_legal: 'Associate Compliance & Legal',
  audit_associate: 'Audit Associate',
  audit_compliance_associate: 'Audit Compliance Associate',
  executive: 'Executive',
  executive_audit_accounts: 'Executive Audit & Accounts',
  executive_compliance_legal: 'Executive Compliance & Legal',
  assistant: 'Assistant',
  audit_assistant: 'Audit Assistant',
  compliance_assistant: 'Compliance Assistant',
  trainee: 'Trainee',
};

export interface RoleGroup {
  group: string;
  roles: Array<{ value: string; label: string }>;
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    group: 'Management',
    roles: [
      { value: 'admin', label: 'Admin' },
      { value: 'sub-admin', label: 'Sub Admin' },
    ],
  },
  {
    group: 'Audit Team',
    roles: [
      { value: 'senior_manager_audit', label: 'Sr. Manager Audit' },
      { value: 'manager_audit', label: 'Manager Audit' },
      { value: 'manager_audit_accounts', label: 'Manager Audit & Accounts' },
      { value: 'associate_audit_accounts', label: 'Associate Audit & Accounts' },
      { value: 'audit_associate', label: 'Audit Associate' },
      { value: 'executive_audit_accounts', label: 'Executive Audit & Accounts' },
      { value: 'audit_assistant', label: 'Audit Assistant' },
    ],
  },
  {
    group: 'Compliance & Legal',
    roles: [
      { value: 'senior_manager_compliance', label: 'Sr. Manager Compliance' },
      { value: 'manager_compliance_legal', label: 'Manager Compliance & Legal' },
      { value: 'associate_compliance_legal', label: 'Associate Compliance & Legal' },
      { value: 'audit_compliance_associate', label: 'Audit Compliance Associate' },
      { value: 'executive_compliance_legal', label: 'Executive Compliance & Legal' },
      { value: 'compliance_assistant', label: 'Compliance Assistant' },
    ],
  },
  {
    group: 'Others',
    roles: [
      { value: 'executive', label: 'Executive' },
      { value: 'associate', label: 'Associate' },
      { value: 'assistant', label: 'Assistant' },
      { value: 'trainee', label: 'Trainee' },
    ],
  },
];


export const DEPARTMENTS: string[] = [
  'Audit & Assurance',
  'Direct Tax',
  'Indirect Tax (GST)',
  'Accounts & Bookkeeping',
  'Payroll',
  'Compliance & Legal',
  'Advisory & Consulting',
  'Corporate Law',
  'Operations',
  'Management',
];

export const DESIGNATIONS: string[] = [
  'Partner',
  'Senior Manager',
  'Manager',
  'Senior Associate',
  'Associate',
  'Senior Trainee',
  'Trainee / Intern',
  'Article Assistant',
  'Operations Executive',
  'Admin',
];
