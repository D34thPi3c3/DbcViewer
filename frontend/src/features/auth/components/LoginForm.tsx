import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import { useMutation } from '@tanstack/react-query'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { login } from '../api/login'
import type { AuthResponse } from '../../../types/auth'

type LoginFormProps = {
  onSuccess: (response: AuthResponse) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      localStorage.setItem('dbcviewer.auth', JSON.stringify(response))
      onSuccess(response)
    },
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await loginMutation.mutateAsync({
        usernameOrEmail,
        password,
      })
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
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            color="primary"
            icon={<ShieldRoundedIcon />}
            label="JWT Auth"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label="React + MUI"
            variant="outlined"
            sx={{ borderColor: 'rgba(0, 105, 92, 0.24)' }}
          />
        </Stack>

        <Box>
          <Typography variant="h5" gutterBottom>
            Anmelden
          </Typography>
          <Typography color="text.secondary">
            Melde dich mit deinem Benutzerkonto an, um spaeter den DBC Viewer zu
            benutzen.
          </Typography>
        </Box>

        {loginMutation.error ? <Alert severity="error">{loginMutation.error.message}</Alert> : null}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Benutzername oder E-Mail"
              autoComplete="username"
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
            />

            <TextField
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon />
                        ) : (
                          <VisibilityRoundedIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              size="large"
              variant="contained"
              startIcon={
                loginMutation.isPending ? <CircularProgress color="inherit" size={18} /> : <LoginRoundedIcon />
              }
              disabled={loginMutation.isPending || !usernameOrEmail.trim() || !password}
            >
              {loginMutation.isPending ? 'Anmeldung laeuft...' : 'Einloggen'}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
