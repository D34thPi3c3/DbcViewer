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
    <TableContainer key={`${message.frameId}:${message.name}`}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Bitbereich</TableCell>
            <TableCell>Format</TableCell>
            <TableCell>Skalierung</TableCell>
            <TableCell>Wertebereich</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Empfänger</TableCell>
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
                  {signal.multiplexerIndicator ? (
                    <Typography variant="caption" color="text.secondary">
                      Multiplexer: {signal.multiplexerIndicator}
                    </Typography>
                  ) : null}
                </Stack>
              </TableCell>
              <TableCell>{`${signal.startBit} | ${signal.bitLength}`}</TableCell>
              <TableCell>{`${signal.byteOrder}, ${signal.valueType}`}</TableCell>
              <TableCell>{`${formatNumber(signal.factor)} / ${formatNumber(signal.offset)}`}</TableCell>
              <TableCell>{`${formatNumber(signal.minimum)} bis ${formatNumber(signal.maximum)}`}</TableCell>
              <TableCell>{signal.unit || '—'}</TableCell>
              <TableCell>{signal.receivers.length > 0 ? signal.receivers.join(', ') : '—'}</TableCell>
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
