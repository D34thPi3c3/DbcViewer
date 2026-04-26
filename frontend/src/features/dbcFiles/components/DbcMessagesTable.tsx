import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { DbcMessageResponse } from '../../../types/dbcFiles'

type DbcMessagesTableProps = {
  messages: DbcMessageResponse[]
  selectedMessageIndex: number
  onSelectMessage: (index: number) => void
}

export function DbcMessagesTable({ messages, selectedMessageIndex, onSelectMessage }: DbcMessagesTableProps) {
  const [searchValue, setSearchValue] = useState('')

  const filteredMessages = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()

    if (!normalizedQuery) {
      return messages.map((message, index) => ({ message, index }))
    }

    return messages
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => {
        const frameIdHex = formatFrameId(message.frameId).toLowerCase()
        const frameIdDecimal = message.frameId.toString()

        return [
          frameIdHex,
          frameIdDecimal,
          message.name.toLowerCase(),
          message.lengthInBytes.toString(),
          message.transmitter.toLowerCase(),
        ].some((value) => value.includes(normalizedQuery))
      })
  }, [messages, searchValue])

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Nachrichten suchen"
        placeholder="ID, Name, DLC oder Sender"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />

      <TableContainer
        sx={{
          maxHeight: { xs: 360, md: 520 },
          overflow: 'hidden',
          borderRadius: 4,
          border: '1px solid rgba(0, 105, 92, 0.12)',
          bgcolor: 'rgba(255, 255, 255, 0.72)',
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            '& .MuiTableCell-head': {
              bgcolor: 'rgba(244, 239, 230, 0.96)',
              fontWeight: 700,
            },
          }}
        >
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
            {filteredMessages.length > 0 ? (
              filteredMessages.map(({ message, index }) => {
                const isSelected = index === selectedMessageIndex

                return (
                  <TableRow
                    key={`${message.frameId}:${message.name}:${index}`}
                    hover
                    selected={isSelected}
                    onClick={() => onSelectMessage(index)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'background-color 160ms ease',
                      '&:last-child .MuiTableCell-root': {
                        borderBottom: 'none',
                      },
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
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">Keine Nachrichten zur Suche gefunden.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}

function formatFrameId(frameId: number) {
  return `0x${frameId.toString(16).toUpperCase().padStart(3, '0')}`
}
