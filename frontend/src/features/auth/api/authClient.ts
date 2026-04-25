import { postJsonRequest } from '../../../app/apiClient'

export async function postAuthRequest<TRequest>(
  path: string,
  request: TRequest,
): Promise<Response> {
  return postJsonRequest(path, request)
}
