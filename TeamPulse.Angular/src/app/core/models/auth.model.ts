export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  department: string;
  phone: string;
  photo: string;
  token: string;
}
