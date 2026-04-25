import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import StorageRoundedIcon from '@mui/icons-material/StorageRounded'
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
import { LoginForm } from '../features/auth/components/LoginForm'
import { RegisterForm } from '../features/auth/components/RegisterForm'
import type { AuthResponse } from '../types/auth'

type AuthMode = 'login' | 'register'

const highlights = [
  {
    icon: <StorageRoundedIcon color="primary" />,
    title: 'DBC-Dateien lesen',
    description: 'Spaeter koennen DBC-Strukturen ueber die API geladen und im Browser durchsucht werden.',
  },
  {
    icon: <LockOpenRoundedIcon color="primary" />,
    title: 'JWT-gesicherter Zugriff',
    description: 'Die Anmeldung spricht bereits mit dem Backend und speichert das Token lokal im Browser.',
  },
  {
    icon: <AutoAwesomeRoundedIcon color="primary" />,
    title: 'Basis fuer React-Frontend',
    description: 'Das Setup ist so angelegt, dass weitere Seiten und API-Calls direkt ergaenzt werden koennen.',
  },
]

export function LoginPage() {
  const [authResult, setAuthResult] = useState<AuthResponse | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [lastCompletedMode, setLastCompletedMode] = useState<AuthMode | null>(null)

  function handleAuthSuccess(mode: AuthMode, response: AuthResponse) {
    setAuthResult(response)
    setLastCompletedMode(mode)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(77, 182, 172, 0.24), transparent 28%), radial-gradient(circle at bottom right, rgba(255, 112, 67, 0.18), transparent 24%), linear-gradient(135deg, #f4efe6 0%, #fcf8f1 44%, #eef8f6 100%)',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center' }}>
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.14em' }}
                >
                  DBC VIEWER
                </Typography>
                <Typography variant="h2" sx={{ mt: 1, maxWidth: 560 }}>
                  Login fuer den kuenftigen Web-Viewer.
                </Typography>
                <Typography sx={{ mt: 2, maxWidth: 560, color: 'text.secondary', fontSize: '1.05rem' }}>
                  Der erste Frontend-Screen ist bewusst schlank gehalten: erst Auth sauber,
                  dann DBC Upload, Suche und Viewer.
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
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 6,
                  border: '1px solid rgba(0, 105, 92, 0.12)',
                  bgcolor: 'rgba(255, 250, 244, 0.88)',
                }}
              >
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant={authMode === 'login' ? 'contained' : 'text'}
                    onClick={() => setAuthMode('login')}
                  >
                    Login
                  </Button>
                  <Button
                    fullWidth
                    variant={authMode === 'register' ? 'contained' : 'text'}
                    onClick={() => setAuthMode('register')}
                  >
                    Registrierung
                  </Button>
                </Stack>
              </Paper>

              {authMode === 'login' ? (
                <LoginForm onSuccess={(response) => handleAuthSuccess('login', response)} />
              ) : (
                <RegisterForm onSuccess={(response) => handleAuthSuccess('register', response)} />
              )}

              {authResult ? (
                <Alert severity="success" sx={{ borderRadius: 4 }}>
                  {lastCompletedMode === 'register' ? 'Konto erstellt' : 'Eingeloggt'} als{' '}
                  <strong>{authResult.user.username}</strong>. Das JWT wurde unter
                  <strong> dbcviewer.auth </strong> im Browser gespeichert.
                </Alert>
              ) : null}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
