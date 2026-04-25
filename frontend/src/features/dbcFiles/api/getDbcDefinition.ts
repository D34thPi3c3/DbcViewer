import { getRequest } from '../../../app/apiClient'
import type { DbcDefinitionResponse } from '../../../types/dbcFiles'

type ValidationProblemDetails = {
  errors?: Record<string, string[]>
}

export async function getDbcDefinition(fileId: string): Promise<DbcDefinitionResponse> {
  const response = await getRequest(`/api/dbc-files/${fileId}/definition`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Die hochgeladene DBC-Datei wurde nicht mehr gefunden.')
    }

    if (response.status === 400) {
      const problem = (await response.json()) as ValidationProblemDetails
      const fileError = problem.errors?.file?.[0]

      if (fileError) {
        throw new Error(fileError)
      }
    }

    throw new Error('Die DBC-Definition konnte nicht geladen werden.')
  }

  return (await response.json()) as DbcDefinitionResponse
}
