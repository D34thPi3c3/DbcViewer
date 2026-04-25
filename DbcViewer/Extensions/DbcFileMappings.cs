using DbcViewer.Contracts.DbcFiles;
using DbcViewer.Entities;

namespace DbcViewer.Extensions;

public static class DbcFileMappings
{
    public static DbcFileResponse ToResponse(this DbcFile file) =>
        new(file.Id, file.OriginalFileName, file.ContentType, file.SizeInBytes, file.UploadedAtUtc);
}
