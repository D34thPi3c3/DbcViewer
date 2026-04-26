import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import {
  Alert,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { DbcDefinitionResponse, DbcMessageResponse } from '../../../types/dbcFiles'
import { updateDbcMessage } from '../api/updateDbcMessage'

type DbcMessagesTableProps = {
  fileId: string
  messages: DbcMessageResponse[]
  selectedMessageIndex: number
  onSelectMessage: (index: number) => void
}

type SortColumn = 'frameId' | 'name' | 'lengthInBytes' | 'transmitter' | 'signalCount'
type SortDirection = 'asc' | 'desc'

export function DbcMessagesTable({
  fileId,
  messages,
  selectedMessageIndex,
  onSelectMessage,
}: DbcMessagesTableProps) {
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [frameIdValue, setFrameIdValue] = useState('')
  const [nameValue, setNameValue] = useState('')
  const [transmitterValue, setTransmitterValue] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('frameId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredMessages = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()
    const mappedMessages = messages.map((message, index) => ({ message, index }))

    const visibleMessages = !normalizedQuery
      ? mappedMessages
      : mappedMessages.filter(({ message }) => {
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
    
    return visibleMessages
      .sort((left, right) => compareMessages(left.message, right.message, sortColumn, sortDirection))
  }, [messages, searchValue, sortColumn, sortDirection])

  const updateMutation = useMutation<
    DbcMessageResponse,
    Error,
    {
      messageId: string
      frameId: number
      name: string
      transmitter: string
    }
  >({
    mutationFn: async ({ messageId, frameId, name, transmitter }) =>
      updateDbcMessage(fileId, messageId, {
        frameId,
        name,
        transmitter,
      }),
    onMutate: () => {
      setFeedbackMessage(null)
      setErrorMessage(null)
    },
    onSuccess: (updatedMessage) => {
      queryClient.setQueryData<DbcDefinitionResponse>(['dbc-definition', fileId], (currentDefinition) => {
        if (!currentDefinition) {
          return currentDefinition
        }

        return {
          ...currentDefinition,
          messages: currentDefinition.messages.map((message) =>
            message.id === updatedMessage.id ? updatedMessage : message,
          ),
        }
      })

      setEditingMessageId(null)
      setFrameIdValue('')
      setNameValue('')
      setTransmitterValue('')
      setFeedbackMessage('Nachricht gespeichert.')
      setErrorMessage(null)
    },
    onError: (error) => {
      setFeedbackMessage(null)
      setErrorMessage(error.message)
    },
  })

  function startEditing(message: DbcMessageResponse, index: number) {
    onSelectMessage(index)
    setEditingMessageId(message.id)
    setFrameIdValue(formatFrameId(message.frameId))
    setNameValue(message.name)
    setTransmitterValue(message.transmitter)
    setFeedbackMessage(null)
    setErrorMessage(null)
  }

  function cancelEditing() {
    setEditingMessageId(null)
    setFrameIdValue('')
    setNameValue('')
    setTransmitterValue('')
    setFeedbackMessage(null)
    setErrorMessage(null)
  }

  async function saveEditing(message: DbcMessageResponse) {
    if (editingMessageId !== message.id) {
      return
    }

    const parsedFrameId = parseFrameIdInput(frameIdValue)
    if (parsedFrameId === null) {
      setFeedbackMessage(null)
      setErrorMessage('CAN_Id muss hexadezimal mit 0x-Präfix oder dezimal angegeben werden.')
      return
    }

    await updateMutation.mutateAsync({
      messageId: message.id,
      frameId: parsedFrameId,
      name: nameValue,
      transmitter: transmitterValue,
    })
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((currentDirection) => currentDirection === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortColumn(column)
    setSortDirection('asc')
  }

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Nachrichten suchen"
        placeholder="ID, Name, DLC oder Sender"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {feedbackMessage ? <Alert severity="success">{feedbackMessage}</Alert> : null}

      <TableContainer
        sx={{
          maxHeight: { xs: 360, md: 520 },
          overflow: 'hidden',
          borderRadius: '18px',
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
              <TableCell sortDirection={sortColumn === 'frameId' ? sortDirection : false}>
                <TableSortLabel
                  active={sortColumn === 'frameId'}
                  direction={sortColumn === 'frameId' ? sortDirection : 'asc'}
                  onClick={() => handleSort('frameId')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortColumn === 'name' ? sortDirection : false}>
                <TableSortLabel
                  active={sortColumn === 'name'}
                  direction={sortColumn === 'name' ? sortDirection : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortColumn === 'lengthInBytes' ? sortDirection : false}>
                <TableSortLabel
                  active={sortColumn === 'lengthInBytes'}
                  direction={sortColumn === 'lengthInBytes' ? sortDirection : 'asc'}
                  onClick={() => handleSort('lengthInBytes')}
                >
                  DLC
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortColumn === 'transmitter' ? sortDirection : false}>
                <TableSortLabel
                  active={sortColumn === 'transmitter'}
                  direction={sortColumn === 'transmitter' ? sortDirection : 'asc'}
                  onClick={() => handleSort('transmitter')}
                >
                  Sender
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortColumn === 'signalCount' ? sortDirection : false}>
                <TableSortLabel
                  active={sortColumn === 'signalCount'}
                  direction={sortColumn === 'signalCount' ? sortDirection : 'asc'}
                  onClick={() => handleSort('signalCount')}
                >
                  Signale
                </TableSortLabel>
              </TableCell>
              <TableCell>Aktion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMessages.length > 0 ? (
              filteredMessages.map(({ message, index }) => {
                const isSelected = index === selectedMessageIndex
                const isEditing = message.id === editingMessageId

                return (
                  <TableRow
                    key={message.id}
                    hover
                    selected={isSelected}
                    onClick={() => onSelectMessage(index)}
                    sx={{
                      transition: 'background-color 160ms ease',
                      '&:last-child .MuiTableCell-root': {
                        borderBottom: 'none',
                      },
                      '& .MuiTableCell-root': {
                        borderColor: 'rgba(0, 105, 92, 0.08)',
                      },
                    }}
                  >
                    <TableCell
                      sx={{ minWidth: 150 }}
                      onDoubleClick={() => {
                        if (!isEditing) {
                          startEditing(message, index)
                        }
                      }}
                    >
                      {isEditing ? (
                        <TextField
                          size="small"
                          variant="standard"
                          autoFocus
                          value={frameIdValue}
                          onChange={(event) => setFrameIdValue(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              void saveEditing(message)
                            }

                            if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelEditing()
                            }
                          }}
                          placeholder="0x100"
                          fullWidth
                          sx={{
                            '& .MuiInputBase-root': {
                              borderRadius: 0,
                            },
                          }}
                        />
                      ) : (
                        formatFrameId(message.frameId)
                      )}
                    </TableCell>
                    <TableCell
                      sx={{ minWidth: 220, fontWeight: 700 }}
                      onDoubleClick={() => {
                        if (!isEditing) {
                          startEditing(message, index)
                        }
                      }}
                    >
                      {isEditing ? (
                        <TextField
                          size="small"
                          variant="standard"
                          value={nameValue}
                          onChange={(event) => setNameValue(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              void saveEditing(message)
                            }

                            if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelEditing()
                            }
                          }}
                          fullWidth
                          sx={{
                            '& .MuiInputBase-root': {
                              borderRadius: 0,
                            },
                          }}
                        />
                      ) : (
                        message.name
                      )}
                    </TableCell>
                    <TableCell>{message.lengthInBytes}</TableCell>
                    <TableCell
                      sx={{ minWidth: 200 }}
                      onDoubleClick={() => {
                        if (!isEditing) {
                          startEditing(message, index)
                        }
                      }}
                    >
                      {isEditing ? (
                        <TextField
                          size="small"
                          variant="standard"
                          value={transmitterValue}
                          onChange={(event) => setTransmitterValue(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              void saveEditing(message)
                            }

                            if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelEditing()
                            }
                          }}
                          fullWidth
                          sx={{
                            '& .MuiInputBase-root': {
                              borderRadius: 0,
                            },
                          }}
                        />
                      ) : (
                        message.transmitter
                      )}
                    </TableCell>
                    <TableCell align="right">{message.signals.length}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Speichern">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={updateMutation.isPending}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void saveEditing(message)
                                }}
                              >
                                <CheckRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Abbrechen">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={updateMutation.isPending}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  cancelEditing()
                                }}
                              >
                                <CloseRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Tooltip title="Gesamte Zeile bearbeiten">
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation()
                              startEditing(message, index)
                            }}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
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

function compareMessages(
  left: DbcMessageResponse,
  right: DbcMessageResponse,
  sortColumn: SortColumn,
  sortDirection: SortDirection,
) {
  const comparison = (() => {
    switch (sortColumn) {
      case 'frameId':
        return left.frameId - right.frameId
      case 'name':
        return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' })
      case 'lengthInBytes':
        return left.lengthInBytes - right.lengthInBytes
      case 'transmitter':
        return left.transmitter.localeCompare(right.transmitter, undefined, { sensitivity: 'base' })
      case 'signalCount':
        return left.signals.length - right.signals.length
    }
  })()

  if (comparison !== 0) {
    return sortDirection === 'asc' ? comparison : -comparison
  }

  return left.frameId - right.frameId
}

function parseFrameIdInput(value: string): number | null {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return null
  }

  const isHexValue = normalizedValue.startsWith('0x') || normalizedValue.startsWith('0X')
  const isValidFormat = isHexValue
    ? /^0x[0-9a-f]+$/i.test(normalizedValue)
    : /^\d+$/.test(normalizedValue)

  if (!isValidFormat) {
    return null
  }

  const parsedValue = isHexValue
    ? Number.parseInt(normalizedValue.slice(2), 16)
    : Number.parseInt(normalizedValue, 10)

  if (!Number.isInteger(parsedValue) || parsedValue < 0 || parsedValue > 0xFFFFFFFF) {
    return null
  }

  return parsedValue
}
