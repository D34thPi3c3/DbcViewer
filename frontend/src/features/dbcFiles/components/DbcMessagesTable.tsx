import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { Alert, Box, Stack, TextField } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  type GridColDef,
  type GridEventListener,
  type GridRenderEditCellParams,
  type GridRowModesModel,
  type GridRowModel,
} from '@mui/x-data-grid'
import type { DbcDefinitionResponse, DbcMessageResponse } from '../../../types/dbcFiles'
import { updateDbcMessage } from '../api/updateDbcMessage'

type DbcMessagesTableProps = {
  fileId: string
  messages: DbcMessageResponse[]
  selectedMessageIndex: number
  onSelectMessage: (index: number) => void
}

type DbcMessageGridRow = {
  id: string
  frameId: number | string
  name: string
  lengthInBytes: number
  transmitter: string
  signalCount: number
  originalIndex: number
}

export function DbcMessagesTable({
  fileId,
  messages,
  selectedMessageIndex,
  onSelectMessage,
}: DbcMessagesTableProps) {
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const selectedMessageId = messages[selectedMessageIndex]?.id ?? null

  const visibleRows = useMemo<DbcMessageGridRow[]>(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()

    return messages
      .map((message, index) => ({
        id: message.id,
        frameId: message.frameId,
        name: message.name,
        lengthInBytes: message.lengthInBytes,
        transmitter: message.transmitter,
        signalCount: message.signals.length,
        originalIndex: index,
      }))
      .filter((message) => {
        if (!normalizedQuery) {
          return true
        }

        return [
          formatFrameIdValue(message.frameId).toLowerCase(),
          String(message.frameId),
          message.name.toLowerCase(),
          String(message.lengthInBytes),
          message.transmitter.toLowerCase(),
          String(message.signalCount),
        ].some((value) => value.includes(normalizedQuery))
      })
  }, [messages, searchValue])

  useEffect(() => {
    setRowModesModel((currentModel) => {
      const nextModel = { ...currentModel }
      let hasChanges = false

      Object.keys(nextModel).forEach((rowId) => {
        const rowStillVisible = visibleRows.some((row) => row.id === rowId)
        if (!rowStillVisible) {
          delete nextModel[rowId]
          hasChanges = true
        }
      })

      return hasChanges ? nextModel : currentModel
    })
  }, [visibleRows])

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

      setFeedbackMessage('Nachricht gespeichert.')
      setErrorMessage(null)
    },
    onError: (error) => {
      setFeedbackMessage(null)
      setErrorMessage(error.message)
    },
  })

  const columns = useMemo<GridColDef<DbcMessageGridRow>[]>(
    () => [
      {
        field: 'frameId',
        headerName: 'ID',
        flex: 0.9,
        minWidth: 140,
        editable: true,
        sortComparator: (left, right) => Number(left) - Number(right),
        valueFormatter: (value) => formatFrameIdValue(value),
        renderEditCell: (params) => (
          <StandardEditInputCell
            {...params}
            initialValueFormatter={(value) => formatFrameIdValue(value)}
            placeholder="0x100"
          />
        ),
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: parseFrameIdInput(String(props.value ?? '')) === null,
        }),
      },
      {
        field: 'name',
        headerName: 'Name',
        flex: 1.3,
        minWidth: 220,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: !String(props.value ?? '').trim(),
        }),
      },
      {
        field: 'lengthInBytes',
        headerName: 'DLC',
        flex: 0.6,
        minWidth: 90,
        editable: false,
        type: 'number',
      },
      {
        field: 'transmitter',
        headerName: 'Sender',
        flex: 1.1,
        minWidth: 180,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: !String(props.value ?? '').trim(),
        }),
      },
      {
        field: 'signalCount',
        headerName: 'Signale',
        flex: 0.7,
        minWidth: 110,
        editable: false,
        type: 'number',
        align: 'right',
        headerAlign: 'right',
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Aktion',
        minWidth: 100,
        getActions: ({ id }) => {
          const isEditing = rowModesModel[id]?.mode === GridRowModes.Edit

          if (isEditing) {
            return [
              <GridActionsCellItem
                key="save"
                icon={<CheckRoundedIcon fontSize="small" />}
                label="Speichern"
                onClick={() => {
                  setRowModesModel((currentModel) => ({
                    ...currentModel,
                    [id]: { mode: GridRowModes.View },
                  }))
                }}
                color="inherit"
              />,
              <GridActionsCellItem
                key="cancel"
                icon={<CloseRoundedIcon fontSize="small" />}
                label="Abbrechen"
                onClick={() => {
                  setRowModesModel((currentModel) => ({
                    ...currentModel,
                    [id]: { mode: GridRowModes.View, ignoreModifications: true },
                  }))
                }}
                color="inherit"
              />,
            ]
          }

          return [
            <GridActionsCellItem
              key="edit"
              icon={<EditRoundedIcon fontSize="small" />}
              label="Bearbeiten"
              onClick={() => {
                setRowModesModel((currentModel) => ({
                  ...currentModel,
                  [id]: { mode: GridRowModes.Edit },
                }))
              }}
              color="inherit"
            />,
          ]
        },
      },
    ],
    [rowModesModel],
  )

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true
    }
  }

  async function processRowUpdate(
    updatedRow: GridRowModel<DbcMessageGridRow>,
    originalRow: GridRowModel<DbcMessageGridRow>,
  ) {
    const parsedFrameId = parseFrameIdInput(String(updatedRow.frameId))
    const nextName = String(updatedRow.name ?? '').trim()
    const nextTransmitter = String(updatedRow.transmitter ?? '').trim()

    if (parsedFrameId === null) {
      throw new Error('CAN_Id muss hexadezimal mit 0x-Präfix oder dezimal angegeben werden.')
    }

    if (!nextName) {
      throw new Error('Name darf nicht leer sein.')
    }

    if (!nextTransmitter) {
      throw new Error('Sender darf nicht leer sein.')
    }

    const savedMessage = await updateMutation.mutateAsync({
      messageId: updatedRow.id,
      frameId: parsedFrameId,
      name: nextName,
      transmitter: nextTransmitter,
    })

    return {
      ...originalRow,
      frameId: savedMessage.frameId,
      name: savedMessage.name,
      transmitter: savedMessage.transmitter,
      signalCount: savedMessage.signals.length,
    }
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

      <Box
        sx={{
          height: { xs: 420, md: 560 },
          borderRadius: '18px',
          border: '1px solid rgba(0, 105, 92, 0.12)',
          bgcolor: 'rgba(255, 255, 255, 0.72)',
          overflow: 'hidden',
        }}
      >
        <DataGrid
          rows={visibleRows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) => setErrorMessage(error.message)}
          disableRowSelectionOnClick
          hideFooter
          loading={updateMutation.isPending}
          onRowClick={(params) => {
            onSelectMessage(params.row.originalIndex)
          }}
          getRowClassName={(params) =>
            params.row.id === selectedMessageId ? 'dbc-message-row-selected' : ''
          }
          sx={{
            border: 'none',
            '--DataGrid-overlayHeight': '160px',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'rgba(244, 239, 230, 0.96)',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              borderColor: 'rgba(0, 105, 92, 0.08)',
              alignItems: 'center',
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: 'rgba(0, 105, 92, 0.04)',
            },
            '& .dbc-message-row-selected': {
              bgcolor: 'rgba(0, 105, 92, 0.08)',
            },
            '& .dbc-message-row-selected:hover': {
              bgcolor: 'rgba(0, 105, 92, 0.12)',
            },
            '& .MuiDataGrid-row.MuiDataGrid-row--editing': {
              boxShadow: 'none',
              bgcolor: 'rgba(255, 250, 244, 0.92)',
            },
            '& .MuiDataGrid-cell--editing': {
              px: 1,
              boxShadow: 'none',
              bgcolor: 'transparent',
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
              outline: 'none',
            },
          }}
        />
      </Box>
    </Stack>
  )
}

type StandardEditInputCellProps = GridRenderEditCellParams<DbcMessageGridRow> & {
  initialValueFormatter?: (value: unknown) => string
  placeholder?: string
}

function StandardEditInputCell({
  api,
  field,
  hasFocus,
  id,
  initialValueFormatter,
  placeholder,
  value,
}: StandardEditInputCellProps) {
  const formattedValue = initialValueFormatter
    ? initialValueFormatter(value)
    : String(value ?? '')
  const [localValue, setLocalValue] = useState(formattedValue)

  useEffect(() => {
    setLocalValue(formattedValue)
  }, [formattedValue])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value
    setLocalValue(nextValue)
    void api.setEditCellValue({ id, field, value: nextValue }, event)
  }

  return (
    <TextField
      size="small"
      variant="standard"
      value={localValue}
      onChange={handleChange}
      autoFocus={hasFocus}
      placeholder={placeholder}
      fullWidth
      slotProps={{
        input: {
          disableUnderline: true,
        },
      }}
      onClick={(event) => event.stopPropagation()}
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: 0,
        },
      }}
    />
  )
}

function formatFrameIdValue(frameId: unknown) {
  const numericValue =
    typeof frameId === 'number'
      ? frameId
      : typeof frameId === 'string'
        ? parseFrameIdInput(frameId)
        : null

  if (numericValue === null) {
    return String(frameId ?? '')
  }

  return `0x${numericValue.toString(16).toUpperCase().padStart(3, '0')}`
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
