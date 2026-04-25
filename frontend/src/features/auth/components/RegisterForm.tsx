import AppRegistrationRoundedIcon from '@mui/icons-material/AppRegistrationRounded'
import { useMutation } from '@tanstack/react-query'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import MailRoundedIcon from '@mui/icons-material/MailRounded'
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
import { register } from '../api/register'
import type { AuthResponse } from '../../../types/auth'

type RegisterFormProps = {
  onSuccess: (response: AuthResponse) => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (response) => {
      localStorage.setItem('dbcviewer.auth', JSON.stringify(response))
      onSuccess(response)
    },
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')

    if (password !== confirmPassword) {
      setValidationError('Die Passwörter stimmen nicht überein.')
      return
    }

    try {
      await registerMutation.mutateAsync({
        username,
        email,
        password,
      })
    } catch {
      // Fehlerzustand wird über die Mutation gerendert.
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
          <Chip
            color="primary"
            icon={<ShieldRoundedIcon />}
            label="Neues Konto"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label="Username + E-Mail"
            variant="outlined"
            sx={{ borderColor: 'rgba(0, 105, 92, 0.24)' }}
          />
        </Stack>

        <Box>
          <Typography variant="h5" gutterBottom>
            Registrieren
          </Typography>
          <Typography color="text.secondary">
            Lege ein Konto an. Nach erfolgreicher Registrierung bist du direkt eingeloggt.
          </Typography>
        </Box>

        {validationError || registerMutation.error ? (
          <Alert severity="error">{validationError || registerMutation.error?.message}</Alert>
        ) : null}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Benutzername"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeRoundedIcon color="primary" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="E-Mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailRoundedIcon color="primary" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              helperText="Mindestens 8 Zeichen."
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

            <TextField
              label="Passwort bestätigen"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={Boolean(confirmPassword) && password !== confirmPassword}
              helperText={
                confirmPassword && password !== confirmPassword
                  ? 'Die Passwörter stimmen nicht überein.'
                  : ' '
              }
            />

            <Button
              type="submit"
              size="large"
              variant="contained"
              startIcon={
                registerMutation.isPending ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <AppRegistrationRoundedIcon />
                )
              }
              disabled={
                registerMutation.isPending ||
                username.trim().length < 3 ||
                !email.trim() ||
                password.length < 8 ||
                password !== confirmPassword
              }
            >
              {registerMutation.isPending ? 'Registrierung läuft...' : 'Konto erstellen'}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
