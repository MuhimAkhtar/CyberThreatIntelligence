export enum UserRole {
  ADMIN = 'ADMIN',
  SOC_ANALYST = 'SOC_ANALYST',
  INVESTIGATOR = 'INVESTIGATOR',
  AUDITOR = 'AUDITOR',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
