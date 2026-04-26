import { postJsonRequest } from '../../../app/apiClient'
import type { DbcMessageResponse } from '../../../types/dbcFiles'

type CreateDbcMessageRequest = {
  frameId: number
  lengthInBytes: number
  name: string
  transmitter: string
}

type ValidationProblemDetails = {
  errors?: Record<string, string[]>
}

export async function createDbcMessage(
  fileId: string,
  request: CreateDbcMessageRequest,
): Promise<DbcMessageResponse> {
  const response = await postJsonRequest(`/api/dbc-files/${fileId}/messages`, request)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Die ausgewählte DBC-Datei wurde nicht mehr gefunden.')
    }

    if (response.status === 400) {
      const problem = (await response.json()) as ValidationProblemDetails
      const prioritizedErrors = ['frameId', 'lengthInBytes', 'name', 'transmitter']
        .map((key) => problem.errors?.[key]?.[0])
        .find((value) => value)

      if (prioritizedErrors) {
        throw new Error(prioritizedErrors)
      }
    }

    throw new Error('Die Nachricht konnte nicht angelegt werden.')
  }

  return (await response.json()) as DbcMessageResponse
}
