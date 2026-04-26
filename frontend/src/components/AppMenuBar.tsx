import { Link, useRouterState } from '@tanstack/react-router'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'

export function AppMenuBar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <Paper
        elevation={0}
        sx={{
          px: { xs: 2, md: 4 },
          py: { xs: 1.5, md: 2 },
          borderRadius: 0,
          borderBottom: '1px solid rgba(0, 105, 92, 0.16)',
          bgcolor: 'rgba(255, 250, 244, 0.9)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 12px 30px rgba(0, 77, 64, 0.08)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 3.5,
                bgcolor: 'rgba(0, 105, 92, 0.12)',
                color: 'primary.main',
              }}
            >
              <SpaceDashboardRoundedIcon />
            </Box>

            <Box>
              <Typography
                variant="overline"
                sx={{ display: 'block', color: 'primary.main', fontWeight: 800, letterSpacing: '0.14em' }}
              >
                DBC VIEWER
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Navigation zwischen Upload und Login
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ minWidth: { md: 280 } }}>
            <Button
              fullWidth
              component={Link}
              to="/"
              variant={pathname === '/' ? 'contained' : 'text'}
              startIcon={<CloudUploadRoundedIcon />}
            >
              Upload
            </Button>
            <Button
              fullWidth
              component={Link}
              to="/login"
              variant={pathname === '/login' ? 'contained' : 'text'}
              startIcon={<LoginRoundedIcon />}
            >
              Login
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
