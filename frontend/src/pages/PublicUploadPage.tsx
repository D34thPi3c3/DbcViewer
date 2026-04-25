import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { PublicDbcUploadForm } from '../features/dbcFiles/components/PublicDbcUploadForm'
import type { DbcFileResponse } from '../types/dbcFiles'

type PublicUploadPageProps = {
  onNavigateToLogin: () => void
}

const highlights = [
  {
    icon: <PublicRoundedIcon color="primary" />,
    title: 'Ohne Login erreichbar',
    description: 'Die Startseite ist oeffentlich und eignet sich als einfacher Eingang fuer DBC-Uploads.',
  },
  {
    icon: <UploadFileRoundedIcon color="primary" />,
    title: 'Direkter Datei-Upload',
    description: 'Auswahl per Dateidialog oder Drag-and-Drop, danach geht die Datei direkt an die API.',
  },
  {
    icon: <StorageRoundedIcon color="primary" />,
    title: 'Persistenz im Backend',
    description: 'Die API speichert den Inhalt der DBC-Datei zusammen mit Metadaten in PostgreSQL.',
  },
]

export function PublicUploadPage({ onNavigateToLogin }: PublicUploadPageProps) {
  const [uploadedFile, setUploadedFile] = useState<DbcFileResponse | null>(null)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(77, 182, 172, 0.22), transparent 26%), radial-gradient(circle at 85% 15%, rgba(255, 112, 67, 0.2), transparent 22%), linear-gradient(145deg, #f4efe6 0%, #fff8ef 48%, #edf8f3 100%)',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.14em' }}
                >
                  DBC VIEWER
                </Typography>
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<LoginRoundedIcon />}
                  onClick={onNavigateToLogin}
                  sx={{ px: 0, minHeight: 'unset' }}
                >
                  Zum Login
                </Button>
              </Stack>

              <Box>
                <Typography variant="h2" sx={{ mt: 1, maxWidth: 560 }}>
                  Oeffentliche Upload-Seite fuer DBC-Dateien.
                </Typography>
                <Typography sx={{ mt: 2, maxWidth: 560, color: 'text.secondary', fontSize: '1.05rem' }}>
                  Diese Seite ist bewusst auf den ersten Schritt optimiert: Datei abgeben,
                  Upload bestaetigen, spaeter im Viewer weiterverarbeiten.
                </Typography>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 6,
                  border: '1px solid rgba(0, 105, 92, 0.12)',
                  bgcolor: 'rgba(255, 250, 244, 0.78)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <List disablePadding>
                  {highlights.map((highlight) => (
                    <ListItem key={highlight.title} disableGutters sx={{ alignItems: 'flex-start', py: 1.25 }}>
                      <ListItemIcon sx={{ minWidth: 44 }}>{highlight.icon}</ListItemIcon>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 700 }}>{highlight.title}</Typography>}
                        secondary={
                          <Typography component="span" color="text.secondary">
                            {highlight.description}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              {uploadedFile ? (
                <Alert severity="info" icon={<CloudUploadRoundedIcon fontSize="inherit" />} sx={{ borderRadius: 4 }}>
                  Letzter Upload: <strong>{uploadedFile.fileName}</strong> am{' '}
                  <strong>{new Date(uploadedFile.uploadedAtUtc).toLocaleString('de-CH')}</strong>.
                </Alert>
              ) : null}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <PublicDbcUploadForm onSuccess={setUploadedFile} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
