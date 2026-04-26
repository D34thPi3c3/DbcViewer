import { Box, Paper, Stack, Typography } from '@mui/material'

type DefinitionTableCardProps = {
  title: string
  description: string
  children: React.ReactNode
}

export function DefinitionTableCard({ title, description, children }: DefinitionTableCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 0,
        p: 3,
        borderRadius: '24px',
        border: '1px solid rgba(0, 105, 92, 0.12)',
        bgcolor: 'rgba(255, 250, 244, 0.82)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 18px 40px rgba(0, 77, 64, 0.08)',
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Box>
        {children}
      </Stack>
    </Paper>
  )
}
