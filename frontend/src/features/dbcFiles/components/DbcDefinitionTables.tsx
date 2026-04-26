import DatasetRoundedIcon from '@mui/icons-material/DatasetRounded'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import { Chip, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { DbcDefinitionResponse } from '../../../types/dbcFiles'
import { DbcMessagesTable } from './DbcMessagesTable'
import { DbcSignalsTable } from './DbcSignalsTable'
import { DefinitionTableCard } from './DefinitionTableCard'

type DbcDefinitionTablesProps = {
  definition: DbcDefinitionResponse
}

export function DbcDefinitionTables({ definition }: DbcDefinitionTablesProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    definition.messages[0]?.id ?? null,
  )

  useEffect(() => {
    setSelectedMessageId(definition.messages[0]?.id ?? null)
  }, [definition.fileId])

  useEffect(() => {
    if (!selectedMessageId) {
      if (definition.messages.length > 0) {
        setSelectedMessageId(definition.messages[0].id)
      }
      return
    }

    const selectedMessageStillExists = definition.messages.some((message) => message.id === selectedMessageId)
    if (!selectedMessageStillExists) {
      setSelectedMessageId(definition.messages[0]?.id ?? null)
    }
  }, [definition.messages, selectedMessageId])

  const selectedMessage = definition.messages.find((message) => message.id === selectedMessageId) ?? null

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

      <Stack spacing={3}>
        <DefinitionTableCard
          title="Nachrichten"
          description="Wähle eine Nachricht aus. Der Stift in der Aktionsspalte schaltet die komplette Zeile für `CAN_Id`, `Name` und `Sender` in den Bearbeitungsmodus."
        >
          <DbcMessagesTable
            fileId={definition.fileId}
            messages={definition.messages}
            selectedMessageId={selectedMessageId}
            onSelectMessage={setSelectedMessageId}
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
          <DbcSignalsTable fileId={definition.fileId} message={selectedMessage} />
        </DefinitionTableCard>
      </Stack>
    </Stack>
  )
}

function formatFrameId(frameId: number) {
  return `0x${frameId.toString(16).toUpperCase().padStart(3, '0')}`
}
