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
    : 'Noch keine Datei ausgewählt.'

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
      // Fehlerzustand wird über die Mutation gerendert.
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        boxShadow: '0 28px 70px rgba(0, 77, 64, 0.14)',
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Chip
            color="primary"
            icon={<CloudUploadRoundedIcon />}
            label="Öffentlicher Upload"
            size="small"
            sx={{ fontWeight: 700 }}
          />
          <Chip label="Nur .dbc" size="small" variant="outlined" sx={{ borderColor: 'rgba(0, 105, 92, 0.24)' }} />
        </Stack>

        <Box>
          <Typography variant="h6" gutterBottom>
            DBC-Datei hochladen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kompakt per Drag-and-Drop oder Dateiauswahl. Die Datei wird direkt im Backend gespeichert.
          </Typography>
        </Box>

        {uploadMutation.error ? <Alert severity="error">{uploadMutation.error.message}</Alert> : null}

        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          sx={{
            borderRadius: 4,
            border: isDragging ? '2px solid' : '1px dashed rgba(0, 105, 92, 0.28)',
            borderColor: isDragging ? 'primary.main' : 'rgba(0, 105, 92, 0.28)',
            bgcolor: isDragging ? 'rgba(77, 182, 172, 0.08)' : 'rgba(255, 250, 244, 0.7)',
            transition: 'all 180ms ease',
            cursor: 'pointer',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'auto minmax(0, 1fr) auto auto' },
              gap: 1.5,
              alignItems: 'center',
              p: { xs: 1.5, md: 1.75 },
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(0, 105, 92, 0.12)',
                color: 'primary.main',
                mx: { xs: 'auto', md: 0 },
              }}
            >
              <DescriptionRoundedIcon sx={{ fontSize: 22 }} />
            </Box>

            <Box sx={{ minWidth: 0, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {selectedFile ? selectedFile.name : 'Datei ablegen oder auswählen'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: selectedFile ? 'nowrap' : 'normal',
                }}
              >
                {selectedFile
                  ? `Bereit zum Upload · ${formatFileSize(selectedFile.size)}`
                  : `Drag-and-Drop oder Klick · akzeptiert nur ${acceptedExtension}`}
              </Typography>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedExtension}
              hidden
              onChange={handleInputChange}
            />

            <Button
              size="small"
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation()
                fileInputRef.current?.click()
              }}
              sx={{
                minWidth: 130,
              }}
            >
              Datei wählen
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={
                uploadMutation.isPending ? (
                  <CircularProgress color="inherit" size={16} />
                ) : (
                  <CloudUploadRoundedIcon />
                )
              }
              disabled={uploadMutation.isPending || !selectedFile}
              onClick={(event) => {
                event.stopPropagation()
                void handleUpload()
              }}
              sx={{
                minWidth: 150,
              }}
            >
              {uploadMutation.isPending ? 'Upload läuft...' : 'Jetzt hochladen'}
            </Button>
          </Box>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            color: 'text.secondary',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <InsertDriveFileRoundedIcon fontSize="small" />
            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFileLabel}
            </Typography>
          </Stack>
          <Typography variant="caption">Formateinschränkung: nur {acceptedExtension}</Typography>
        </Stack>

        {uploadMutation.data ? (
          <Alert
            severity="success"
            icon={<TaskAltRoundedIcon fontSize="inherit" />}
            sx={{ borderRadius: 4 }}
          >
            Datei <strong>{uploadMutation.data.fileName}</strong> gespeichert. Größe:{' '}
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
