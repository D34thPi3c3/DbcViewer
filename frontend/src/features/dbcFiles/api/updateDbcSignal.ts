import { putJsonRequest } from '../../../app/apiClient'
import type { DbcSignalResponse } from '../../../types/dbcFiles'

type UpdateDbcSignalRequest = {
  name: string
  multiplexerIndicator: string | null
  startBit: number
  bitLength: number
  byteOrder: string
  valueType: string
  factor: number
  offset: number
  minimum: number
  maximum: number
  unit: string
  comment: string | null
}

type ValidationProblemDetails = {
  errors?: Record<string, string[]>
}

export async function updateDbcSignal(
  fileId: string,
  messageId: string,
  signalId: string,
  request: UpdateDbcSignalRequest,
): Promise<DbcSignalResponse> {
  const response = await putJsonRequest(
    `/api/dbc-files/${fileId}/messages/${messageId}/signals/${signalId}`,
    request,
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Das ausgewählte Signal wurde nicht mehr gefunden.')
    }

    if (response.status === 400) {
      const problem = (await response.json()) as ValidationProblemDetails
      const prioritizedErrors = [
        'name',
        'multiplexerIndicator',
        'startBit',
        'bitLength',
        'byteOrder',
        'valueType',
        'unit',
      ]
        .map((key) => problem.errors?.[key]?.[0])
        .find((value) => value)

      if (prioritizedErrors) {
        throw new Error(prioritizedErrors)
      }
    }

    throw new Error('Das Signal konnte nicht gespeichert werden.')
  }

  return (await response.json()) as DbcSignalResponse
}
