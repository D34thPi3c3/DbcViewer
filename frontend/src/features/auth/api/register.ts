import type { AuthResponse, RegisterRequest } from '../../../types/auth'
import { postAuthRequest } from './authClient'

type ValidationProblemDetails = {
  errors?: Record<string, string[]>
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const response = await postAuthRequest('/api/auth/register', request)

  if (!response.ok) {
    if (response.status === 400) {
      const problem = (await response.json()) as ValidationProblemDetails
      const usernameError = problem.errors?.username?.[0]
      const emailError = problem.errors?.email?.[0]

      if (usernameError && emailError) {
        throw new Error(`${usernameError} ${emailError}`)
      }

      if (usernameError || emailError) {
        throw new Error(usernameError ?? emailError)
      }
    }

    throw new Error('Die Registrierung konnte nicht abgeschlossen werden.')
  }

  return (await response.json()) as AuthResponse
}
