import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { DbcDefinitionResponse, DbcMessageResponse } from '../../../types/dbcFiles'
import { updateDbcMessage } from '../api/updateDbcMessage'

type DbcMessageEditorProps = {
  fileId: string
  message: DbcMessageResponse | null
}

export function DbcMessageEditor({ fileId, message }: DbcMessageEditorProps) {
  const queryClient = useQueryClient()
  const [frameIdValue, setFrameIdValue] = useState('')
  const [name, setName] = useState('')
  const [transmitter, setTransmitter] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) {
      setFrameIdValue('')
      setName('')
      setTransmitter('')
      setLocalError(null)
      setSuccessMessage(null)
      return
    }

    setFrameIdValue(formatFrameIdInput(message.frameId))
    setName(message.name)
    setTransmitter(message.transmitter)
    setLocalError(null)
    setSuccessMessage(null)
  }, [message])

  const updateMutation = useMutation<DbcMessageResponse, Error>({
    mutationFn: async () => {
      if (!message) {
        throw new Error('Keine Nachricht ausgewählt.')
      }

      const parsedFrameId = parseFrameIdInput(frameIdValue)
      if (parsedFrameId === null) {
        throw new Error('CAN_Id muss hexadezimal mit 0x-Präfix oder dezimal angegeben werden.')
      }

      return updateDbcMessage(fileId, message.id, {
        frameId: parsedFrameId,
        name,
        transmitter,
      })
    },
    onSuccess: (updatedMessage) => {
      queryClient.setQueryData<DbcDefinitionResponse>(['dbc-definition', fileId], (currentDefinition) => {
        if (!currentDefinition) {
          return currentDefinition
        }

        return {
          ...currentDefinition,
          messages: currentDefinition.messages.map((currentMessage) =>
            currentMessage.id === updatedMessage.id ? updatedMessage : currentMessage,
          ),
        }
      })

      setFrameIdValue(formatFrameIdInput(updatedMessage.frameId))
      setName(updatedMessage.name)
      setTransmitter(updatedMessage.transmitter)
      setLocalError(null)
      setSuccessMessage('Nachricht gespeichert.')
    },
    onError: (error) => {
      setLocalError(error.message)
      setSuccessMessage(null)
    },
  })

  const isDirty = useMemo(() => {
    if (!message) {
      return false
    }

    return (
      frameIdValue.trim() !== formatFrameIdInput(message.frameId)
      || name !== message.name
      || transmitter !== message.transmitter
    )
  }, [frameIdValue, message, name, transmitter])

  if (!message) {
    return (
      <Typography color="text.secondary">
        Wähle eine Nachricht aus der Tabelle, um `CAN_Id`, `Name` und `Sender` anzupassen.
      </Typography>
    )
  }

  const selectedMessage = message

  function handleReset() {
    setFrameIdValue(formatFrameIdInput(selectedMessage.frameId))
    setName(selectedMessage.name)
    setTransmitter(selectedMessage.transmitter)
    setLocalError(null)
    setSuccessMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)
    setSuccessMessage(null)

    try {
      await updateMutation.mutateAsync()
    } catch {
      // Fehlerzustand wird oberhalb gerendert.
    }
  }

  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        void handleSubmit(event)
      }}
      sx={{
        p: 2,
        borderRadius: '18px',
        border: '1px solid rgba(0, 105, 92, 0.12)',
        bgcolor: 'rgba(255, 255, 255, 0.56)',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Nachricht bearbeiten
      </Typography>

      {localError ? <Alert severity="error">{localError}</Alert> : null}
      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField
          label="CAN_Id"
          value={frameIdValue}
          onChange={(event) => setFrameIdValue(event.target.value)}
          placeholder="0x100"
          helperText="Hex mit 0x oder Dezimalwert"
          fullWidth
        />
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
        />
        <TextField
          label="Sender"
          value={transmitter}
          onChange={(event) => setTransmitter(event.target.value)}
          fullWidth
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          type="submit"
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          disabled={updateMutation.isPending || !isDirty}
        >
          {updateMutation.isPending ? 'Speichert...' : 'Änderungen speichern'}
        </Button>
        <Button variant="outlined" onClick={handleReset} disabled={updateMutation.isPending || !isDirty}>
          Zurücksetzen
        </Button>
      </Stack>
    </Stack>
  )
}

function formatFrameIdInput(frameId: number) {
  return `0x${frameId.toString(16).toUpperCase()}`
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
