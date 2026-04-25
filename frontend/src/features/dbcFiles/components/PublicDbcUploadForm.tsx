import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { useMutation } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { uploadDbcFile } from '../api/uploadDbcFile'
import type { DbcFileResponse } from '../../../types/dbcFiles'

type PublicDbcUploadFormProps = {
  onSuccess: (response: DbcFileResponse) => void
}

const acceptedExtension = '.dbc'

export function PublicDbcUploadForm({ onSuccess }: PublicDbcUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const uploadMutation = useMutation({
    mutationFn: uploadDbcFile,
    onSuccess: (response) => {
      onSuccess(response)
    },
  })

  const selectedFileLabel = selectedFile
    ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
    : 'Noch keine Datei ausgewaehlt.'

  function handleFileSelection(file: File | null) {
    setSelectedFile(file)
    uploadMutation.reset()
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFileSelection(event.target.files?.[0] ?? null)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleFileSelection(event.dataTransfer.files?.[0] ?? null)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  async function handleUpload() {
    if (!selectedFile) {
      return
    }

    try {
      await uploadMutation.mutateAsync(selectedFile)
    } catch {
      // Fehlerzustand wird ueber die Mutation gerendert.
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        border: '1px solid rgba(0, 105, 92, 0.12)',
        boxShadow: '0 28px 70px rgba(0, 77, 64, 0.14)',
      }}
    >
      <Stack spacing={3}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Chip color="primary" icon={<CloudUploadRoundedIcon />} label="Oeffentlicher Upload" sx={{ fontWeight: 700 }} />
          <Chip label="Nur .dbc" variant="outlined" sx={{ borderColor: 'rgba(0, 105, 92, 0.24)' }} />
        </Stack>

        <Box>
          <Typography variant="h5" gutterBottom>
            DBC-Datei hochladen
          </Typography>
          <Typography color="text.secondary">
            Die Datei wird direkt an das Backend gesendet und dort in der Datenbank gespeichert.
          </Typography>
        </Box>

        {uploadMutation.error ? <Alert severity="error">{uploadMutation.error.message}</Alert> : null}

        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            position: 'relative',
            borderRadius: 6,
            border: isDragging ? '2px solid' : '1px dashed rgba(0, 105, 92, 0.28)',
            borderColor: isDragging ? 'primary.main' : 'rgba(0, 105, 92, 0.28)',
            bgcolor: isDragging ? 'rgba(77, 182, 172, 0.08)' : 'rgba(255, 250, 244, 0.7)',
            transition: 'all 180ms ease',
          }}
        >
          <Stack spacing={2} sx={{ p: { xs: 3, md: 4 }, alignItems: 'center', textAlign: 'center' }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '24px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(0, 105, 92, 0.12)',
                color: 'primary.main',
              }}
            >
              <DescriptionRoundedIcon sx={{ fontSize: 34 }} />
            </Box>

            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="h6">Datei ablegen oder manuell auswaehlen</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
                Es werden nur Dateien mit der Endung {acceptedExtension} akzeptiert.
              </Typography>
            </Stack>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedExtension}
              hidden
              onChange={handleInputChange}
            />

            <Button variant="outlined" onClick={() => fileInputRef.current?.click()}>
              Datei waehlen
            </Button>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                width: '100%',
                maxWidth: 460,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                px: 2,
                py: 1.5,
                bgcolor: 'rgba(0, 77, 64, 0.06)',
                color: 'text.secondary',
              }}
            >
              <InsertDriveFileRoundedIcon fontSize="small" />
              <Typography sx={{ fontSize: '0.95rem' }}>{selectedFileLabel}</Typography>
            </Stack>
          </Stack>
        </Box>

        <Button
          size="large"
          variant="contained"
          startIcon={
            uploadMutation.isPending ? (
              <CircularProgress color="inherit" size={18} />
            ) : (
              <CloudUploadRoundedIcon />
            )
          }
          disabled={uploadMutation.isPending || !selectedFile}
          onClick={handleUpload}
        >
          {uploadMutation.isPending ? 'Upload laeuft...' : 'Jetzt hochladen'}
        </Button>

        {uploadMutation.data ? (
          <Alert
            severity="success"
            icon={<TaskAltRoundedIcon fontSize="inherit" />}
            sx={{ borderRadius: 4 }}
          >
            Datei <strong>{uploadMutation.data.fileName}</strong> gespeichert. Groesse:{' '}
            <strong>{formatFileSize(uploadMutation.data.sizeInBytes)}</strong>.
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  )
}

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}
