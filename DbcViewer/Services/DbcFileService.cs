using DbcViewer.Data;
using DbcViewer.Entities;
using DbcViewer.Extensions;
using DbcViewer.Services.Results;
using Microsoft.AspNetCore.Http;

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

        var dbcFile = new DbcFile
        {
            OriginalFileName = Path.GetFileName(file.FileName),
            ContentType = string.IsNullOrWhiteSpace(file.ContentType)
                ? "application/octet-stream"
                : file.ContentType,
            SizeInBytes = file.Length,
            Content = memoryStream.ToArray(),
            UploadedAtUtc = DateTime.UtcNow
        };

        dbContext.DbcFiles.Add(dbcFile);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new UploadDbcFileResult
        {
            File = dbcFile.ToResponse()
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
