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

    public async Task<UpdateDbcSignalResult> UpdateSignalAsync(
        Guid fileId,
        Guid messageId,
        Guid signalId,
        UpdateDbcSignalRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationErrors = Validate(request);
        if (validationErrors.Count > 0)
        {
            return new UpdateDbcSignalResult
            {
                Errors = validationErrors
            };
        }

        var dbcSignal = await dbContext.DbcSignals
            .Include(signal => signal.DbcMessage)
            .SingleOrDefaultAsync(
                signal => signal.Id == signalId
                          && signal.DbcMessageId == messageId
                          && signal.DbcMessage.DbcFileId == fileId,
                cancellationToken);

        if (dbcSignal is null)
        {
            return new UpdateDbcSignalResult
            {
                NotFound = true
            };
        }

        dbcSignal.Name = request.Name.Trim();
        dbcSignal.MultiplexerIndicator = string.IsNullOrWhiteSpace(request.MultiplexerIndicator)
            ? null
            : request.MultiplexerIndicator.Trim();
        dbcSignal.StartBit = request.StartBit;
        dbcSignal.BitLength = request.BitLength;
        dbcSignal.ByteOrder = request.ByteOrder.Trim();
        dbcSignal.ValueType = request.ValueType.Trim();
        dbcSignal.Factor = request.Factor;
        dbcSignal.Offset = request.Offset;
        dbcSignal.Minimum = request.Minimum;
        dbcSignal.Maximum = request.Maximum;
        dbcSignal.Unit = request.Unit.Trim();
        dbcSignal.Comment = string.IsNullOrWhiteSpace(request.Comment)
            ? null
            : request.Comment.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateDbcSignalResult
        {
            Signal = dbcSignal.ToResponse()
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

    private static Dictionary<string, string[]> Validate(UpdateDbcSignalRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            errors["name"] = ["The signal name is required."];
        }
        else if (request.Name.Trim().Length > 255)
        {
            errors["name"] = ["The signal name must be 255 characters or fewer."];
        }

        if (!string.IsNullOrWhiteSpace(request.MultiplexerIndicator)
            && request.MultiplexerIndicator.Trim().Length > 50)
        {
            errors["multiplexerIndicator"] = ["The mode must be 50 characters or fewer."];
        }
        else if (!string.IsNullOrWhiteSpace(request.MultiplexerIndicator)
                 && !IsValidMultiplexerIndicator(request.MultiplexerIndicator.Trim()))
        {
            errors["multiplexerIndicator"] = ["The mode must be M or m followed by a number."];
        }

        if (request.StartBit < 0)
        {
            errors["startBit"] = ["The start bit must be zero or greater."];
        }

        if (request.BitLength <= 0)
        {
            errors["bitLength"] = ["The bit length must be greater than zero."];
        }

        if (string.IsNullOrWhiteSpace(request.ByteOrder))
        {
            errors["byteOrder"] = ["The byte order is required."];
        }
        else if (request.ByteOrder.Trim() is not ("little-endian" or "big-endian"))
        {
            errors["byteOrder"] = ["The byte order must be either little-endian or big-endian."];
        }

        if (string.IsNullOrWhiteSpace(request.ValueType))
        {
            errors["valueType"] = ["The value type is required."];
        }
        else if (request.ValueType.Trim() is not ("unsigned" or "signed" or "float" or "double"))
        {
            errors["valueType"] = ["The value type must be unsigned, signed, float, or double."];
        }

        if (request.Unit.Trim().Length > 100)
        {
            errors["unit"] = ["The unit must be 100 characters or fewer."];
        }

        return errors;
    }

    private static bool IsValidMultiplexerIndicator(string value) =>
        value == "M" || (value.StartsWith('m') && value.Length > 1 && value[1..].All(char.IsDigit));
}
