namespace DbcViewer.Contracts.DbcFiles;

public sealed record DbcDefinitionResponse(
    Guid FileId,
    string FileName,
    DateTime UploadedAtUtc,
    IReadOnlyList<DbcMessageResponse> Messages);
