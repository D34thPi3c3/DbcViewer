import { postMultipartRequest } from '../../../app/apiClient'
import type { DbcFileResponse } from '../../../types/dbcFiles'

type ValidationProblemDetails = {
  errors?: Record<string, string[]>
}

export async function uploadDbcFile(file: File): Promise<DbcFileResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await postMultipartRequest('/api/dbc-files/upload', formData)

  if (!response.ok) {
    if (response.status === 400) {
      const problem = (await response.json()) as ValidationProblemDetails
      const fileError = problem.errors?.file?.[0]

      if (fileError) {
        throw new Error(fileError)
      }
    }

    throw new Error('Der DBC-Upload konnte nicht abgeschlossen werden.')
  }

  return (await response.json()) as DbcFileResponse
}
