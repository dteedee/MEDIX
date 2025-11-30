export interface UserDTO {
  id: string;
  email: string;
  userName?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  role?: string; 
  roles?: string[]; 
  emailConfirmed?: boolean;
  lockoutEnabled?: boolean;
  lockoutEnd?: string | null;
  dateOfBirth?: string;
  genderCode?: string;
  identificationNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  accessFailedCount?: number;
  isProfileCompleted?: boolean;
}

export interface CreateUserRequest {
  userName: string;
  email: string;
  role?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  role?: string;
  emailConfirmed?: boolean;
  dateOfBirth?: string;
  genderCode?: string;
  identificationNumber?: string;
  lockoutEnabled?: boolean;
  lockoutEnd?: string | null;
  isProfileCompleted?: boolean;
  accessFailedCount?: number;
}