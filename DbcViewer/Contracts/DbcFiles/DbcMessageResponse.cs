namespace DbcViewer.Contracts.DbcFiles;

public sealed record DbcMessageResponse(
    uint FrameId,
    string Name,
    ushort LengthInBytes,
    string Transmitter,
    IReadOnlyList<DbcSignalResponse> Signals);
