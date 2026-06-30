export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

export interface CustomerImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
