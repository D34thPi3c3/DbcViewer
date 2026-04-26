import { useQuery } from '@tanstack/react-query'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import {
  Alert,
  Box,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { AppMenuBar } from '../components/AppMenuBar'
import { getDbcDefinition } from '../features/dbcFiles/api/getDbcDefinition'
import { DbcDefinitionTables } from '../features/dbcFiles/components/DbcDefinitionTables'
import { PublicDbcUploadForm } from '../features/dbcFiles/components/PublicDbcUploadForm'
import type { DbcFileResponse } from '../types/dbcFiles'

export function PublicUploadPage() {
  const [uploadedFile, setUploadedFile] = useState<DbcFileResponse | null>(null)
  const definitionQuery = useQuery({
    queryKey: ['dbc-definition', uploadedFile?.id],
    queryFn: () => getDbcDefinition(uploadedFile!.id),
    enabled: uploadedFile !== null,
  })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(77, 182, 172, 0.22), transparent 26%), radial-gradient(circle at 85% 15%, rgba(255, 112, 67, 0.2), transparent 22%), linear-gradient(145deg, #f4efe6 0%, #fff8ef 48%, #edf8f3 100%)',
        pb: { xs: 4, md: 8 },
      }}
    >
      <AppMenuBar />

      <Stack spacing={4} sx={{ pt: { xs: 3, md: 4 } }}>
        <Box sx={{ px: { xs: 2, md: 4 } }}>
          <Stack spacing={3}>
            {uploadedFile ? (
              <Alert severity="info" icon={<CloudUploadRoundedIcon fontSize="inherit" />} sx={{ borderRadius: 0 }}>
                Letzter Upload: <strong>{uploadedFile.fileName}</strong> am{' '}
                <strong>{new Date(uploadedFile.uploadedAtUtc).toLocaleString('de-CH')}</strong>.
              </Alert>
            ) : null}

            <PublicDbcUploadForm onSuccess={setUploadedFile} />
          </Stack>
        </Box>

        {uploadedFile ? (
          <Box sx={{ px: { xs: 2, md: 4 } }}>
            <Stack spacing={3}>
              {definitionQuery.isPending ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 0,
                    border: '1px solid rgba(0, 105, 92, 0.12)',
                    bgcolor: 'rgba(255, 250, 244, 0.82)',
                  }}
                >
                  <Typography variant="h5">DBC-Struktur wird geladen</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Nachrichten und Signale werden aus dem Backend abgefragt.
                  </Typography>
                </Paper>
              ) : null}

              {definitionQuery.error ? (
                <Alert severity="error" sx={{ borderRadius: 0 }}>
                  {definitionQuery.error.message}
                </Alert>
              ) : null}

              {definitionQuery.data ? <DbcDefinitionTables definition={definitionQuery.data} /> : null}
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}
