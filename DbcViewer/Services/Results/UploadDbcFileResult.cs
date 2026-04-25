using DbcViewer.Contracts.DbcFiles;

namespace DbcViewer.Services.Results;

public sealed class UploadDbcFileResult
{
    public DbcFileResponse? File { get; init; }
    public Dictionary<string, string[]> Errors { get; init; } = [];
    public bool Succeeded => File is not null && Errors.Count == 0;
}
