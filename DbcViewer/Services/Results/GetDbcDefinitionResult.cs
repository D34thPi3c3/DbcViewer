using DbcViewer.Contracts.DbcFiles;

namespace DbcViewer.Services.Results;

public sealed class GetDbcDefinitionResult
{
    public DbcDefinitionResponse? Definition { get; init; }
    public Dictionary<string, string[]> Errors { get; init; } = [];
    public bool NotFound { get; init; }
    public bool Succeeded => Definition is not null && !NotFound && Errors.Count == 0;
}
