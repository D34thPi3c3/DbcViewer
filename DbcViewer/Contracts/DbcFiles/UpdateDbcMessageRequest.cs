namespace DbcViewer.Contracts.DbcFiles;

public sealed record UpdateDbcMessageRequest(
    long FrameId,
    string Name,
    string Transmitter);
