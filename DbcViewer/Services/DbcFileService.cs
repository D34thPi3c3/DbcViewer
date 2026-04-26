using DbcViewer.Data;
using DbcViewer.Contracts.DbcFiles;
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

    public async Task<UpdateDbcMessageResult> UpdateMessageAsync(
        Guid fileId,
        Guid messageId,
        UpdateDbcMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationErrors = Validate(request);
        if (validationErrors.Count > 0)
        {
            return new UpdateDbcMessageResult
            {
                Errors = validationErrors
            };
        }

        var dbcMessage = await dbContext.DbcMessages
            .Include(message => message.Signals.OrderBy(signal => signal.SortOrder))
            .SingleOrDefaultAsync(
                message => message.Id == messageId && message.DbcFileId == fileId,
                cancellationToken);

        if (dbcMessage is null)
        {
            return new UpdateDbcMessageResult
            {
                NotFound = true
            };
        }

        var normalizedName = request.Name.Trim();
        var normalizedTransmitter = request.Transmitter.Trim();

        var frameIdAlreadyAssigned = await dbContext.DbcMessages
            .AnyAsync(
                message => message.DbcFileId == fileId
                           && message.Id != messageId
                           && message.FrameId == request.FrameId,
                cancellationToken);

        if (frameIdAlreadyAssigned)
        {
            return new UpdateDbcMessageResult
            {
                Errors = new Dictionary<string, string[]>
                {
                    ["frameId"] = ["The CAN ID is already used by another message in this file."]
                }
            };
        }

        dbcMessage.FrameId = request.FrameId;
        dbcMessage.Name = normalizedName;
        dbcMessage.Transmitter = normalizedTransmitter;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateDbcMessageResult
        {
            Message = dbcMessage.ToResponse()
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

    private static Dictionary<string, string[]> Validate(UpdateDbcMessageRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (request.FrameId is < 0 or > uint.MaxValue)
        {
            errors["frameId"] = ["The CAN ID must be between 0 and 4294967295."];
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            errors["name"] = ["The message name is required."];
        }
        else if (request.Name.Trim().Length > 255)
        {
            errors["name"] = ["The message name must be 255 characters or fewer."];
        }

        if (string.IsNullOrWhiteSpace(request.Transmitter))
        {
            errors["transmitter"] = ["The transmitter is required."];
        }
        else if (request.Transmitter.Trim().Length > 255)
        {
            errors["transmitter"] = ["The transmitter must be 255 characters or fewer."];
        }

        return errors;
    }
}
