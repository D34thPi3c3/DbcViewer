using DbcViewer.Contracts.DbcFiles;

namespace DbcViewer.Services.Results;

public sealed class UpdateDbcMessageResult
{
    public DbcMessageResponse? Message { get; init; }
    public Dictionary<string, string[]> Errors { get; init; } = [];
    public bool NotFound { get; init; }
    public bool Succeeded => Message is not null && !NotFound && Errors.Count == 0;
}
