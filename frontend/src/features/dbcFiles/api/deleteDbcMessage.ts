import { deleteRequest } from '../../../app/apiClient'

export async function deleteDbcMessage(fileId: string, messageId: string): Promise<void> {
  const response = await deleteRequest(`/api/dbc-files/${fileId}/messages/${messageId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Die ausgewählte Nachricht wurde nicht mehr gefunden.')
    }

    throw new Error('Die Nachricht konnte nicht gelöscht werden.')
  }
}
