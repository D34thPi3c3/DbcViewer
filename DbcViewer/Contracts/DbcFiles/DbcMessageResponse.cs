namespace DbcViewer.Contracts.DbcFiles;

public sealed record DbcMessageResponse(
    Guid Id,
    uint FrameId,
    string Name,
    ushort LengthInBytes,
    string Transmitter,
    IReadOnlyList<DbcSignalResponse> Signals);
