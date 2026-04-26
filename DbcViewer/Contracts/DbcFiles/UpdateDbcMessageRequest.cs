namespace DbcViewer.Contracts.DbcFiles;

public sealed record UpdateDbcMessageRequest(
    long FrameId,
    int LengthInBytes,
    string Name,
    string Transmitter);
