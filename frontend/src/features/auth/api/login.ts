import type { AuthResponse, LoginRequest } from '../../../types/auth'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7090'

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Benutzername oder Passwort ist falsch.')
    }

    throw new Error('Die Anmeldung konnte nicht abgeschlossen werden.')
  }

  return (await response.json()) as AuthResponse
}
