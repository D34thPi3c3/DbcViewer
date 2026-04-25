const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5000'

export async function postAuthRequest<TRequest>(
  path: string,
  request: TRequest,
): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
}
