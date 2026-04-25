using DbcViewer.Services.Results;
using Microsoft.AspNetCore.Http;

namespace DbcViewer.Services;

public interface IDbcFileService
{
    Task<UploadDbcFileResult> UploadAsync(IFormFile? file, CancellationToken cancellationToken = default);
    Task<GetDbcDefinitionResult> GetDefinitionAsync(Guid fileId, CancellationToken cancellationToken = default);
}
