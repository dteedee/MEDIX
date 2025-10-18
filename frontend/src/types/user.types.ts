export interface UserDTO {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  role?: string; // Thường là vai trò chính, ví dụ: "PATIENT"
  roles?: string[]; // Danh sách tất cả các vai trò
  emailConfirmed?: boolean;
  lockoutEnabled?: boolean;
  dateOfBirth?: string;
  genderCode?: string;
  identificationNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  password?: string;
  passwordConfirmation?: string;
  phoneNumber?: string;
  roleCodes: string[]; // Backend mong đợi một mảng các vai trò
  dateOfBirth?: string;
  genderCode?: string;
  identificationNumber?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  phoneNumber?: string;
  roleCodes?: string[]; // Backend mong đợi một mảng các vai trò
  emailConfirmed?: boolean;
  password?: string;
  passwordConfirmation?: string;
  dateOfBirth?: string;
  genderCode?: string;
  identificationNumber?: string;
  lockoutEnabled?: boolean;
}