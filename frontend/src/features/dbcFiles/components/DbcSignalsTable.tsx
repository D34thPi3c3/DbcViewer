import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { DbcMessageResponse } from '../../../types/dbcFiles'

type DbcSignalsTableProps = {
  message: DbcMessageResponse | null
}

export function DbcSignalsTable({ message }: DbcSignalsTableProps) {
  if (!message) {
    return (
      <Box
        sx={{
          minHeight: 240,
          display: 'grid',
          placeItems: 'center',
          color: 'text.secondary',
        }}
      >
        <Typography>Keine Signale verfügbar.</Typography>
      </Box>
    )
  }

  return (
    <TableContainer
      key={`${message.frameId}:${message.name}`}
      sx={{
        maxHeight: { xs: 420, md: 520 },
        overflow: 'auto',
        borderRadius: 0,
      }}
    >
      <Table size="small" stickyHeader sx={{ minWidth: 1360 }}>
        <TableHead>
          <TableRow>
            <TableCell>Signalname</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell>Startbit</TableCell>
            <TableCell>Bitlänge</TableCell>
            <TableCell>Byteorder</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Faktor</TableCell>
            <TableCell>Offset</TableCell>
            <TableCell>Min</TableCell>
            <TableCell>Max</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Kommentar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {message.signals.map((signal, index) => (
            <TableRow
              key={`${message.frameId}:${message.name}:${signal.name}:${signal.startBit}:${index}`}
              sx={{
                '& .MuiTableCell-root': {
                  borderColor: 'rgba(0, 105, 92, 0.08)',
                  verticalAlign: 'top',
                },
              }}
            >
              <TableCell>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontWeight: 700 }}>{signal.name}</Typography>
                </Stack>
              </TableCell>
              <TableCell>{formatSignalMode(signal.multiplexerIndicator)}</TableCell>
              <TableCell>{signal.startBit}</TableCell>
              <TableCell>{signal.bitLength}</TableCell>
              <TableCell>{signal.byteOrder}</TableCell>
              <TableCell>{signal.valueType}</TableCell>
              <TableCell>{formatNumber(signal.factor)}</TableCell>
              <TableCell>{formatNumber(signal.offset)}</TableCell>
              <TableCell>{formatNumber(signal.minimum)}</TableCell>
              <TableCell>{formatNumber(signal.maximum)}</TableCell>
              <TableCell>{signal.unit || '—'}</TableCell>
              <TableCell sx={{ minWidth: 240, whiteSpace: 'normal' }}>{signal.comment || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toString()
}

function formatSignalMode(multiplexerIndicator: string | null) {
  if (!multiplexerIndicator) {
    return 'Einzelsignal'
  }

  if (multiplexerIndicator === 'M') {
    return 'Multiplexer'
  }

  if (multiplexerIndicator.startsWith('m')) {
    return `Multiplexerwert ${multiplexerIndicator.slice(1)}`
  }

  return multiplexerIndicator
}
