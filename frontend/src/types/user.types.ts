export interface UserDTO {
  id: string;
  email: string;
  userName?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  role?: string; // Thường là vai trò chính, ví dụ: "PATIENT"
  roles?: string[]; // Danh sách tất cả các vai trò
  emailConfirmed?: boolean;
  lockoutEnabled?: boolean;
  lockoutEnd?: string | null;
  dateOfBirth?: string;
  genderCode?: string;
  identificationNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  accessFailedCount?: number;
}

export interface CreateUserRequest {
  userName: string;
  password: string;
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
}