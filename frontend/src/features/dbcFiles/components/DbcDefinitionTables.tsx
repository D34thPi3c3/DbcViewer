import DatasetRoundedIcon from '@mui/icons-material/DatasetRounded'
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded'
import { Chip, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { DbcDefinitionResponse } from '../../../types/dbcFiles'
import { DbcMessagesTable } from './DbcMessagesTable'
import { DbcMessageEditor } from './DbcMessageEditor'
import { DbcSignalsTable } from './DbcSignalsTable'
import { DefinitionTableCard } from './DefinitionTableCard'

type DbcDefinitionTablesProps = {
  definition: DbcDefinitionResponse
}

export function DbcDefinitionTables({ definition }: DbcDefinitionTablesProps) {
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0)

  useEffect(() => {
    setSelectedMessageIndex(0)
  }, [definition])

  const selectedMessage = definition.messages[selectedMessageIndex] ?? null

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
          description="Wähle eine Nachricht aus, um Signale zu sehen und `CAN_Id`, `Name` oder `Sender` anzupassen."
        >
          <DbcMessagesTable
            messages={definition.messages}
            selectedMessageIndex={selectedMessageIndex}
            onSelectMessage={setSelectedMessageIndex}
          />
          <DbcMessageEditor fileId={definition.fileId} message={selectedMessage} />
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

function formatFrameId(frameId: number) {
  return `0x${frameId.toString(16).toUpperCase().padStart(3, '0')}`
}
