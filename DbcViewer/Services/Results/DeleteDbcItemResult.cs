namespace DbcViewer.Services.Results;

public sealed class DeleteDbcItemResult
{
    public bool NotFound { get; init; }
    public bool Succeeded => !NotFound;
}
