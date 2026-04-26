using DbcViewer.Contracts.DbcFiles;

namespace DbcViewer.Services.Results;

public sealed class UpdateDbcSignalResult
{
    public DbcSignalResponse? Signal { get; init; }
    public Dictionary<string, string[]> Errors { get; init; } = [];
    public bool NotFound { get; init; }
    public bool Succeeded => Signal is not null && !NotFound && Errors.Count == 0;
}
