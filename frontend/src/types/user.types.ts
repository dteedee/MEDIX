export interface UserDTO {
  id: string
  email: string
  fullName?: string
  phoneNumber?: string
  role?: string
  emailConfirmed?: boolean
  createdAt?: string
}

export interface GetUsersResponse {
  total: number
  data: UserDTO[]
}

export interface CreateUserRequest {
  email: string
  fullName?: string
  phoneNumber?: string
  role?: string
  password?: string
  passwordConfirmation?: string
  dateOfBirth?: string
  identificationNumber?: string
  genderCode?: string
  emailConfirmed?: boolean
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {}
