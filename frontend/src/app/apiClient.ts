const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5000'

export async function getRequest(path: string): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    method: 'GET',
  })
}

export async function postJsonRequest<TRequest>(
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

export async function postMultipartRequest(path: string, formData: FormData): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    body: formData,
  })
}
