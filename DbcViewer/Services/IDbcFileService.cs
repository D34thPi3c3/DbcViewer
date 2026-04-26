using DbcViewer.Services.Results;
using Microsoft.AspNetCore.Http;
using DbcViewer.Contracts.DbcFiles;

namespace DbcViewer.Services;

public interface IDbcFileService
{
    Task<UploadDbcFileResult> UploadAsync(IFormFile? file, CancellationToken cancellationToken = default);
    Task<GetDbcDefinitionResult> GetDefinitionAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<UpdateDbcMessageResult> UpdateMessageAsync(
        Guid fileId,
        Guid messageId,
        UpdateDbcMessageRequest request,
        CancellationToken cancellationToken = default);
}
