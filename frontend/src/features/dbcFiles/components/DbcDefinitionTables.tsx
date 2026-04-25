import DatasetRoundedIcon from '@mui/icons-material/DatasetRounded'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import { Chip, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { DbcDefinitionResponse, DbcMessageResponse } from '../../../types/dbcFiles'
import { DbcMessagesTable } from './DbcMessagesTable'
import { DbcSignalsTable } from './DbcSignalsTable'
import { DefinitionTableCard } from './DefinitionTableCard'

type DbcDefinitionTablesProps = {
  definition: DbcDefinitionResponse
}

export function DbcDefinitionTables({ definition }: DbcDefinitionTablesProps) {
  const [selectedMessageKey, setSelectedMessageKey] = useState<string | null>(null)

  useEffect(() => {
    setSelectedMessageKey(getMessageKey(definition.messages[0]) ?? null)
  }, [definition])

  const selectedMessage =
    definition.messages.find((message) => getMessageKey(message) === selectedMessageKey) ?? definition.messages[0] ?? null

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Chip color="primary" icon={<DatasetRoundedIcon />} label={`${definition.messages.length} Nachrichten`} />
        <Chip
          variant="outlined"
          icon={<GraphicEqRoundedIcon />}
          label={`${definition.messages.reduce((total, message) => total + message.signals.length, 0)} Signale`}
        />
        <Typography color="text.secondary">
          Datei: <strong>{definition.fileName}</strong>
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={3}>
        <DefinitionTableCard
          title="Nachrichten"
          description="Wähle eine Nachricht aus, um die zugehörigen Signale zu sehen."
        >
          <DbcMessagesTable
            messages={definition.messages}
            selectedMessage={selectedMessage}
            onSelectMessage={(message) => setSelectedMessageKey(getMessageKey(message))}
          />
        </DefinitionTableCard>

        <DefinitionTableCard
          title={selectedMessage ? `Signale von ${selectedMessage.name}` : 'Signale'}
          description={
            selectedMessage
              ? `${selectedMessage.signals.length} Signale für Nachricht ${formatFrameId(selectedMessage.frameId)}.`
              : 'Noch keine Nachricht ausgewählt.'
          }
        >
          <DbcSignalsTable message={selectedMessage} />
        </DefinitionTableCard>
      </Stack>
    </Stack>
  )
}

function getMessageKey(message: DbcMessageResponse | null | undefined) {
  if (!message) {
    return null
  }

  return `${message.frameId}:${message.name}`
}

function formatFrameId(frameId: number) {
  return `0x${frameId.toString(16).toUpperCase().padStart(3, '0')}`
}
