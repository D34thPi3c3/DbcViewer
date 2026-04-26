import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { Alert, Autocomplete, Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
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
import type { DbcDefinitionResponse, DbcMessageResponse, DbcSignalResponse } from '../../../types/dbcFiles'
import { updateDbcSignal } from '../api/updateDbcSignal'

type DbcSignalsTableProps = {
  fileId: string
  message: DbcMessageResponse | null
}

type DbcSignalGridRow = {
  id: string
  name: string
  multiplexerIndicator: string
  startBit: number
  bitLength: number
  byteOrder: string
  valueType: string
  factor: number
  offset: number
  minimum: number
  maximum: number
  unit: string
  comment: string
  originalIndex: number
}

export function DbcSignalsTable({ fileId, message }: DbcSignalsTableProps) {
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({})
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const visibleRows = useMemo<DbcSignalGridRow[]>(() => {
    if (!message) {
      return []
    }

    const normalizedQuery = searchValue.trim().toLowerCase()

    return message.signals
      .map((signal, index) => ({
        id: signal.id,
        name: signal.name,
        multiplexerIndicator: signal.multiplexerIndicator ?? '',
        startBit: signal.startBit,
        bitLength: signal.bitLength,
        byteOrder: signal.byteOrder,
        valueType: signal.valueType,
        factor: signal.factor,
        offset: signal.offset,
        minimum: signal.minimum,
        maximum: signal.maximum,
        unit: signal.unit,
        comment: signal.comment ?? '',
        originalIndex: index,
      }))
      .filter((signal) => {
        if (!normalizedQuery) {
          return true
        }

        return [
          signal.name.toLowerCase(),
          formatSignalMode(signal.multiplexerIndicator).toLowerCase(),
          String(signal.startBit),
          String(signal.bitLength),
          signal.byteOrder.toLowerCase(),
          signal.valueType.toLowerCase(),
          String(signal.factor),
          String(signal.offset),
          String(signal.minimum),
          String(signal.maximum),
          signal.unit.toLowerCase(),
          signal.comment.toLowerCase(),
        ].some((value) => value.includes(normalizedQuery))
      })
  }, [message, searchValue])

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
    DbcSignalResponse,
    Error,
    {
      signalId: string
      name: string
      multiplexerIndicator: string | null
      startBit: number
      bitLength: number
      byteOrder: string
      valueType: string
      factor: number
      offset: number
      minimum: number
      maximum: number
      unit: string
      comment: string | null
    }
  >({
    mutationFn: async (request) => {
      if (!message) {
        throw new Error('Keine Nachricht ausgewählt.')
      }

      return updateDbcSignal(fileId, message.id, request.signalId, {
        name: request.name,
        multiplexerIndicator: request.multiplexerIndicator,
        startBit: request.startBit,
        bitLength: request.bitLength,
        byteOrder: request.byteOrder,
        valueType: request.valueType,
        factor: request.factor,
        offset: request.offset,
        minimum: request.minimum,
        maximum: request.maximum,
        unit: request.unit,
        comment: request.comment,
      })
    },
    onMutate: () => {
      setFeedbackMessage(null)
      setErrorMessage(null)
    },
    onSuccess: (updatedSignal) => {
      if (!message) {
        return
      }

      queryClient.setQueryData<DbcDefinitionResponse>(['dbc-definition', fileId], (currentDefinition) => {
        if (!currentDefinition) {
          return currentDefinition
        }

        return {
          ...currentDefinition,
          messages: currentDefinition.messages.map((currentMessage) => {
            if (currentMessage.id !== message.id) {
              return currentMessage
            }

            return {
              ...currentMessage,
              signals: currentMessage.signals.map((currentSignal) =>
                currentSignal.id === updatedSignal.id ? updatedSignal : currentSignal,
              ),
            }
          }),
        }
      })

      setFeedbackMessage('Signal gespeichert.')
      setErrorMessage(null)
    },
    onError: (error) => {
      setFeedbackMessage(null)
      setErrorMessage(error.message)
    },
  })

  const columns = useMemo<GridColDef<DbcSignalGridRow>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Signalname',
        flex: 1.2,
        minWidth: 200,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: !String(props.value ?? '').trim(),
        }),
      },
      {
        field: 'multiplexerIndicator',
        headerName: 'Mode',
        flex: 0.9,
        minWidth: 150,
        editable: true,
        valueFormatter: (value) => formatSignalMode(String(value ?? '')),
        renderEditCell: (params) => (
          <ModeEditCell
            {...params}
          />
        ),
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: !isValidMultiplexerIndicator(String(props.value ?? '')),
        }),
      },
      {
        field: 'startBit',
        headerName: 'Startbit',
        flex: 0.7,
        minWidth: 110,
        editable: true,
        type: 'number',
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: parseIntegerValue(props.value) === null || parseIntegerValue(props.value)! < 0,
        }),
      },
      {
        field: 'bitLength',
        headerName: 'Bitlänge',
        flex: 0.7,
        minWidth: 110,
        editable: true,
        type: 'number',
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: parseIntegerValue(props.value) === null || parseIntegerValue(props.value)! <= 0,
        }),
      },
      {
        field: 'byteOrder',
        headerName: 'Byteorder',
        flex: 0.9,
        minWidth: 140,
        editable: true,
        renderEditCell: (params) => (
          <SelectEditCell
            {...params}
            options={byteOrderOptions}
          />
        ),
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: !isValidByteOrder(String(props.value ?? '')),
        }),
      },
      {
        field: 'valueType',
        headerName: 'Type',
        flex: 0.8,
        minWidth: 120,
        editable: true,
        renderEditCell: (params) => (
          <SelectEditCell
            {...params}
            options={valueTypeOptions}
          />
        ),
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: !isValidValueType(String(props.value ?? '')),
        }),
      },
      {
        field: 'factor',
        headerName: 'Faktor',
        flex: 0.7,
        minWidth: 110,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: parseFloatValue(props.value) === null,
        }),
      },
      {
        field: 'offset',
        headerName: 'Offset',
        flex: 0.7,
        minWidth: 110,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: parseFloatValue(props.value) === null,
        }),
      },
      {
        field: 'minimum',
        headerName: 'Min',
        flex: 0.7,
        minWidth: 100,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: parseFloatValue(props.value) === null,
        }),
      },
      {
        field: 'maximum',
        headerName: 'Max',
        flex: 0.7,
        minWidth: 100,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: parseFloatValue(props.value) === null,
        }),
      },
      {
        field: 'unit',
        headerName: 'Unit',
        flex: 0.8,
        minWidth: 120,
        editable: true,
        preProcessEditCellProps: ({ props }) => ({
          ...props,
          error: String(props.value ?? '').trim().length > 100,
        }),
      },
      {
        field: 'comment',
        headerName: 'Kommentar',
        flex: 1.3,
        minWidth: 240,
        editable: true,
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
    updatedRow: GridRowModel<DbcSignalGridRow>,
    originalRow: GridRowModel<DbcSignalGridRow>,
  ) {
    const parsedStartBit = parseIntegerValue(updatedRow.startBit)
    const parsedBitLength = parseIntegerValue(updatedRow.bitLength)
    const parsedFactor = parseFloatValue(updatedRow.factor)
    const parsedOffset = parseFloatValue(updatedRow.offset)
    const parsedMinimum = parseFloatValue(updatedRow.minimum)
    const parsedMaximum = parseFloatValue(updatedRow.maximum)
    const nextByteOrder = String(updatedRow.byteOrder ?? '').trim()
    const nextValueType = String(updatedRow.valueType ?? '').trim()
    const nextName = String(updatedRow.name ?? '').trim()
    const nextUnit = String(updatedRow.unit ?? '').trim()
    const nextMode = normalizeMultiplexerIndicator(updatedRow.multiplexerIndicator)

    if (!nextName) {
      throw new Error('Signalname darf nicht leer sein.')
    }

    if (parsedStartBit === null || parsedStartBit < 0) {
      throw new Error('Startbit muss null oder größer sein.')
    }

    if (parsedBitLength === null || parsedBitLength <= 0) {
      throw new Error('Bitlänge muss größer als null sein.')
    }

    if (!isValidByteOrder(nextByteOrder)) {
      throw new Error('Byteorder muss little-endian oder big-endian sein.')
    }

    if (!isValidValueType(nextValueType)) {
      throw new Error('Type muss unsigned, signed, float oder double sein.')
    }

    if (
      parsedFactor === null
      || parsedOffset === null
      || parsedMinimum === null
      || parsedMaximum === null
    ) {
      throw new Error('Faktor, Offset, Min und Max müssen gültige Zahlen sein.')
    }

    if (nextUnit.length > 100) {
      throw new Error('Unit darf maximal 100 Zeichen haben.')
    }

    if (nextMode === undefined) {
      throw new Error('Mode muss leer, M oder m1/m2/... sein.')
    }

    const savedSignal = await updateMutation.mutateAsync({
      signalId: updatedRow.id,
      name: nextName,
      multiplexerIndicator: nextMode,
      startBit: parsedStartBit,
      bitLength: parsedBitLength,
      byteOrder: nextByteOrder,
      valueType: nextValueType,
      factor: parsedFactor,
      offset: parsedOffset,
      minimum: parsedMinimum,
      maximum: parsedMaximum,
      unit: nextUnit,
      comment: String(updatedRow.comment ?? '').trim() || null,
    })

    return {
      ...originalRow,
      name: savedSignal.name,
      multiplexerIndicator: savedSignal.multiplexerIndicator ?? '',
      startBit: savedSignal.startBit,
      bitLength: savedSignal.bitLength,
      byteOrder: savedSignal.byteOrder,
      valueType: savedSignal.valueType,
      factor: savedSignal.factor,
      offset: savedSignal.offset,
      minimum: savedSignal.minimum,
      maximum: savedSignal.maximum,
      unit: savedSignal.unit,
      comment: savedSignal.comment ?? '',
    }
  }

  if (!message) {
    return (
      <Box
        sx={{
          minHeight: 240,
          display: 'grid',
          placeItems: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography>Keine Signale verfügbar.</Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        label="Signale suchen"
        placeholder="Name, Mode, Startbit, Typ oder Kommentar"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {feedbackMessage ? <Alert severity="success">{feedbackMessage}</Alert> : null}

      <Box
        sx={{
          height: { xs: 460, md: 600 },
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

type StandardEditInputCellProps = GridRenderEditCellParams<DbcSignalGridRow> & {
  initialValueFormatter?: (value: unknown) => string
  placeholder?: string
}

type SelectEditCellProps = GridRenderEditCellParams<DbcSignalGridRow> & {
  options: readonly string[]
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
      onClick={(event) => event.stopPropagation()}
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: 0,
        },
      }}
    />
  )
}

function SelectEditCell({
  api,
  field,
  hasFocus,
  id,
  options,
  value,
}: SelectEditCellProps) {
  const localValue = String(value ?? '')

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value
    void api.setEditCellValue({ id, field, value: nextValue }, event)
  }

  return (
    <TextField
      select
      size="small"
      variant="standard"
      value={localValue}
      onChange={handleChange}
      autoFocus={hasFocus}
      fullWidth
      onClick={(event) => event.stopPropagation()}
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: 0,
        },
      }}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  )
}

function ModeEditCell({
  api,
  field,
  hasFocus,
  id,
  value,
}: GridRenderEditCellParams<DbcSignalGridRow>) {
  const [localValue, setLocalValue] = useState(String(value ?? ''))

  useEffect(() => {
    setLocalValue(String(value ?? ''))
  }, [value])

  function commitValue(nextValue: string) {
    setLocalValue(nextValue)
    void api.setEditCellValue({ id, field, value: nextValue })
  }

  return (
    <Autocomplete
      freeSolo
      autoHighlight
      options={modeOptions}
      value={localValue}
      onChange={(_, nextValue) => {
        commitValue(typeof nextValue === 'string' ? nextValue : '')
      }}
      onInputChange={(_, nextInputValue, reason) => {
        if (reason === 'input') {
          commitValue(nextInputValue)
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          variant="standard"
          autoFocus={hasFocus}
          placeholder="leer, M oder m1"
          onClick={(event) => event.stopPropagation()}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0,
            },
          }}
        />
      )}
    />
  )
}

function formatSignalMode(multiplexerIndicator: string) {
  if (!multiplexerIndicator) {
    return 'Einzelsignal'
  }

  if (multiplexerIndicator === 'M') {
    return 'Multiplexer'
  }

  if (multiplexerIndicator.startsWith('m')) {
    return `Multiplexerwert ${multiplexerIndicator.slice(1)}`
  }

  return multiplexerIndicator
}

function normalizeMultiplexerIndicator(value: unknown): string | null | undefined {
  const normalizedValue = String(value ?? '').trim()

  if (!normalizedValue) {
    return null
  }

  if (normalizedValue === 'M') {
    return 'M'
  }

  if (/^m\d+$/i.test(normalizedValue)) {
    return `m${normalizedValue.slice(1)}`
  }

  return undefined
}

function parseIntegerValue(value: unknown) {
  const normalizedValue = String(value ?? '').trim()

  if (!/^-?\d+$/.test(normalizedValue)) {
    return null
  }

  return Number.parseInt(normalizedValue, 10)
}

function parseFloatValue(value: unknown) {
  const normalizedValue = String(value ?? '').trim()

  if (!normalizedValue) {
    return null
  }

  const parsedValue = Number.parseFloat(normalizedValue)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function isValidByteOrder(value: string) {
  return value === 'little-endian' || value === 'big-endian'
}

function isValidValueType(value: string) {
  return value === 'unsigned' || value === 'signed' || value === 'float' || value === 'double'
}

function isValidMultiplexerIndicator(value: string) {
  return normalizeMultiplexerIndicator(value) !== undefined
}

const byteOrderOptions = ['little-endian', 'big-endian'] as const
const valueTypeOptions = ['unsigned', 'signed', 'float', 'double'] as const
const modeOptions = [
  '',
  'M',
  ...Array.from({ length: 17 }, (_, index) => `m${index}`),
] as const
