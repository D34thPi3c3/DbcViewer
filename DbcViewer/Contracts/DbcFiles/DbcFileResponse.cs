namespace DbcViewer.Contracts.DbcFiles;

public sealed record DbcFileResponse(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeInBytes,
    DateTime UploadedAtUtc);
