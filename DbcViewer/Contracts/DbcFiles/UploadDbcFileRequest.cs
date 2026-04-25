using Microsoft.AspNetCore.Http;

namespace DbcViewer.Contracts.DbcFiles;

public sealed class UploadDbcFileRequest
{
    public IFormFile? File { get; init; }
}
