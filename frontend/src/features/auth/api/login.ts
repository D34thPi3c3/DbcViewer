import type { AuthResponse, LoginRequest } from '../../../types/auth'
import { postAuthRequest } from './authClient'

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await postAuthRequest('/api/auth/login', request)

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Benutzername oder Passwort ist falsch.')
    }

    throw new Error('Die Anmeldung konnte nicht abgeschlossen werden.')
  }

  return (await response.json()) as AuthResponse
}
