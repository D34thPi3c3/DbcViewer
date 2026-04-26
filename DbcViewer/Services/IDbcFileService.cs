using DbcViewer.Services.Results;
using Microsoft.AspNetCore.Http;
using DbcViewer.Contracts.DbcFiles;

namespace DbcViewer.Services;

public interface IDbcFileService
{
    Task<UploadDbcFileResult> UploadAsync(IFormFile? file, CancellationToken cancellationToken = default);
    Task<GetDbcDefinitionResult> GetDefinitionAsync(Guid fileId, CancellationToken cancellationToken = default);
    Task<UpdateDbcMessageResult> CreateMessageAsync(
        Guid fileId,
        UpdateDbcMessageRequest request,
        CancellationToken cancellationToken = default);
    Task<UpdateDbcMessageResult> UpdateMessageAsync(
        Guid fileId,
        Guid messageId,
        UpdateDbcMessageRequest request,
        CancellationToken cancellationToken = default);
    Task<DeleteDbcItemResult> DeleteMessageAsync(
        Guid fileId,
        Guid messageId,
        CancellationToken cancellationToken = default);
    Task<UpdateDbcSignalResult> CreateSignalAsync(
        Guid fileId,
        Guid messageId,
        UpdateDbcSignalRequest request,
        CancellationToken cancellationToken = default);
    Task<UpdateDbcSignalResult> UpdateSignalAsync(
        Guid fileId,
        Guid messageId,
        Guid signalId,
        UpdateDbcSignalRequest request,
        CancellationToken cancellationToken = default);
    Task<DeleteDbcItemResult> DeleteSignalAsync(
        Guid fileId,
        Guid messageId,
        Guid signalId,
        CancellationToken cancellationToken = default);
}
