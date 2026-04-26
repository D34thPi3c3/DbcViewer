import { deleteRequest } from '../../../app/apiClient'

export async function deleteDbcSignal(
  fileId: string,
  messageId: string,
  signalId: string,
): Promise<void> {
  const response = await deleteRequest(`/api/dbc-files/${fileId}/messages/${messageId}/signals/${signalId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Das ausgewählte Signal wurde nicht mehr gefunden.')
    }

    throw new Error('Das Signal konnte nicht gelöscht werden.')
  }
}
