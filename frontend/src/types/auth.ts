export type LoginRequest = {
  usernameOrEmail: string
  password: string
}

export type UserResponse = {
  id: string
  username: string
  email: string
  createdAtUtc: string
}

export type AuthResponse = {
  token: string
  expiresAtUtc: string
  user: UserResponse
}
