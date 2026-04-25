using System.Text;
using DbcViewer.Data;
using DbcViewer.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DbcViewer.Test.Services;

public sealed class DbcFileServiceTests
{
    [Fact]
    public async Task UploadAsync_SavesDbcFileContentAndMetadata()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var fileContent = "VERSION \"1.0\"";
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(fileContent));
        var file = new FormFile(stream, 0, stream.Length, "file", "vehicle.dbc")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/octet-stream"
        };

        // Act
        var result = await service.UploadAsync(file);
        var savedFile = await dbContext.DbcFiles.SingleAsync();

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.File);
        Assert.Equal("vehicle.dbc", result.File!.FileName);
        Assert.Equal("application/octet-stream", result.File.ContentType);
        Assert.Equal(stream.Length, result.File.SizeInBytes);
        Assert.Equal("vehicle.dbc", savedFile.OriginalFileName);
        Assert.Equal("application/octet-stream", savedFile.ContentType);
        Assert.Equal(stream.Length, savedFile.SizeInBytes);
        Assert.Equal(Encoding.UTF8.GetBytes(fileContent), savedFile.Content);
    }

    [Fact]
    public async Task UploadAsync_ReturnsError_WhenFileExtensionIsNotDbc()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes("test"));
        var file = new FormFile(stream, 0, stream.Length, "file", "vehicle.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };

        // Act
        var result = await service.UploadAsync(file);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Null(result.File);
        Assert.Contains("file", result.Errors.Keys);
        Assert.Empty(dbContext.DbcFiles);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }
}
