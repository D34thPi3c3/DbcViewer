using DbcViewer.Data;
using DbcViewer.Entities;
using DbcViewer.Extensions;
using DbcViewer.Services.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DbcViewer.Services;

public sealed class DbcFileService(AppDbContext dbContext) : IDbcFileService
{
    public async Task<UploadDbcFileResult> UploadAsync(IFormFile? file, CancellationToken cancellationToken = default)
    {
        var validationErrors = Validate(file);
        if (validationErrors.Count > 0)
        {
            return new UploadDbcFileResult
            {
                Errors = validationErrors
            };
        }

        await using var memoryStream = new MemoryStream();
        await file!.CopyToAsync(memoryStream, cancellationToken);
        var content = memoryStream.ToArray();

        IReadOnlyList<Contracts.DbcFiles.DbcMessageResponse> parsedMessages;
        try
        {
            parsedMessages = DbcDefinitionParser.Parse(content);
        }
        catch (FormatException)
        {
            return new UploadDbcFileResult
            {
                Errors = new Dictionary<string, string[]>
                {
                    ["file"] = ["The uploaded DBC file could not be parsed into messages and signals."]
                }
            };
        }

        var dbcFile = new DbcFile
        {
            OriginalFileName = Path.GetFileName(file.FileName),
            ContentType = string.IsNullOrWhiteSpace(file.ContentType)
                ? "application/octet-stream"
                : file.ContentType,
            SizeInBytes = file.Length,
            Content = content,
            UploadedAtUtc = DateTime.UtcNow,
            Messages = parsedMessages.ToEntities(dbcFileId: Guid.NewGuid())
        };

        foreach (var message in dbcFile.Messages)
        {
            message.DbcFileId = dbcFile.Id;
        }

        dbContext.DbcFiles.Add(dbcFile);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new UploadDbcFileResult
        {
            File = dbcFile.ToResponse()
        };
    }

    public async Task<GetDbcDefinitionResult> GetDefinitionAsync(
        Guid fileId,
        CancellationToken cancellationToken = default)
    {
        var dbcFile = await dbContext.DbcFiles
            .AsNoTracking()
            .Include(file => file.Messages.OrderBy(message => message.SortOrder))
            .ThenInclude(message => message.Signals.OrderBy(signal => signal.SortOrder))
            .SingleOrDefaultAsync(file => file.Id == fileId, cancellationToken);

        if (dbcFile is null)
        {
            return new GetDbcDefinitionResult
            {
                NotFound = true
            };
        }

        if (dbcFile.Messages.Count == 0)
        {
            return new GetDbcDefinitionResult
            {
                Errors = new Dictionary<string, string[]>
                {
                    ["file"] = ["The stored DBC definition does not contain any normalized messages."]
                }
            };
        }

        return new GetDbcDefinitionResult
        {
            Definition = dbcFile.ToDefinitionResponse()
        };
    }

    private static Dictionary<string, string[]> Validate(IFormFile? file)
    {
        if (file is null)
        {
            return new Dictionary<string, string[]>
            {
                ["file"] = ["A DBC file is required."]
            };
        }

        if (file.Length <= 0)
        {
            return new Dictionary<string, string[]>
            {
                ["file"] = ["The uploaded file is empty."]
            };
        }

        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".dbc", StringComparison.OrdinalIgnoreCase))
        {
            return new Dictionary<string, string[]>
            {
                ["file"] = ["Only files with the .dbc extension are supported."]
            };
        }

        return [];
    }
}
