import { putJsonRequest } from '../../../app/apiClient'
import type { DbcMessageResponse } from '../../../types/dbcFiles'

type UpdateDbcMessageRequest = {
  frameId: number
  name: string
  transmitter: string
}

type ValidationProblemDetails = {
  errors?: Record<string, string[]>
}

export async function updateDbcMessage(
  fileId: string,
  messageId: string,
  request: UpdateDbcMessageRequest,
): Promise<DbcMessageResponse> {
  const response = await putJsonRequest(`/api/dbc-files/${fileId}/messages/${messageId}`, request)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Die ausgewählte Nachricht wurde nicht mehr gefunden.')
    }

    if (response.status === 400) {
      const problem = (await response.json()) as ValidationProblemDetails

      const prioritizedErrors = ['frameId', 'name', 'transmitter']
        .map((key) => problem.errors?.[key]?.[0])
        .find((value) => value)

      if (prioritizedErrors) {
        throw new Error(prioritizedErrors)
      }
    }

    throw new Error('Die Nachricht konnte nicht gespeichert werden.')
  }

  return (await response.json()) as DbcMessageResponse
}
