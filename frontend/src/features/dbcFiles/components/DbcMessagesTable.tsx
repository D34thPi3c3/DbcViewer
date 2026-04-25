import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import type { DbcMessageResponse } from '../../../types/dbcFiles'

type DbcMessagesTableProps = {
  messages: DbcMessageResponse[]
  selectedMessage: DbcMessageResponse | null
  onSelectMessage: (message: DbcMessageResponse) => void
}

export function DbcMessagesTable({ messages, selectedMessage, onSelectMessage }: DbcMessagesTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>DLC</TableCell>
            <TableCell>Sender</TableCell>
            <TableCell align="right">Signale</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {messages.map((message) => {
            const isSelected = getMessageKey(message) === getMessageKey(selectedMessage)

            return (
              <TableRow
                key={getMessageKey(message)}
                hover
                selected={isSelected}
                onClick={() => onSelectMessage(message)}
                sx={{
                  cursor: 'pointer',
                  '& .MuiTableCell-root': {
                    borderColor: 'rgba(0, 105, 92, 0.08)',
                  },
                }}
              >
                <TableCell>{formatFrameId(message.frameId)}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{message.name}</TableCell>
                <TableCell>{message.lengthInBytes}</TableCell>
                <TableCell>{message.transmitter}</TableCell>
                <TableCell align="right">{message.signals.length}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
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
