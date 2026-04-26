export type DbcFileResponse = {
  id: string
  fileName: string
  contentType: string
  sizeInBytes: number
  uploadedAtUtc: string
}

export type DbcDefinitionResponse = {
  fileId: string
  fileName: string
  uploadedAtUtc: string
  messages: DbcMessageResponse[]
}

export type DbcMessageResponse = {
  id: string
  frameId: number
  name: string
  lengthInBytes: number
  transmitter: string
  signals: DbcSignalResponse[]
}

export type DbcSignalResponse = {
  name: string
  multiplexerIndicator: string | null
  startBit: number
  bitLength: number
  byteOrder: string
  valueType: string
  factor: number
  offset: number
  minimum: number
  maximum: number
  unit: string
  receivers: string[]
  comment: string | null
}
