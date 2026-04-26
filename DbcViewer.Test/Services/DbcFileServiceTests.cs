using System.Text;
using DbcViewer.Contracts.DbcFiles;
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
        var fileContent = """
                          VERSION "1.0"

                          BO_ 256 VehicleStatus: 8 Vector__XXX
                           SG_ VehicleSpeed : 0|16@1+ (0.1,0) [0|250] "km/h" Vector__XXX
                          """;
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
        var savedMessage = Assert.Single(savedFile.Messages);
        Assert.Equal(256, savedMessage.FrameId);
        Assert.Equal("VehicleStatus", savedMessage.Name);
        Assert.Equal(8, savedMessage.LengthInBytes);
        var savedSignal = Assert.Single(savedMessage.Signals);
        Assert.Equal("VehicleSpeed", savedSignal.Name);
        Assert.Equal("Vector__XXX", savedSignal.Receivers);
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

    [Fact]
    public async Task GetDefinitionAsync_ReturnsParsedMessagesAndSignals()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var dbcContent = """
                         VERSION "1.0"

                         BO_ 256 VehicleStatus: 8 Vector__XXX
                          SG_ VehicleSpeed : 0|16@1+ (0.1,0) [0|250] "km/h" Vector__XXX,Dashboard
                          SG_ EngineSpeed : 16|16@1+ (0.25,0) [0|8000] "rpm" Vector__XXX
                         """;
        var fileId = await UploadDbcContentAsync(service, dbcContent);

        // Act
        var result = await service.GetDefinitionAsync(fileId);

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Definition);
        Assert.Equal(fileId, result.Definition!.FileId);
        Assert.Single(result.Definition.Messages);

        var message = result.Definition.Messages[0];
        Assert.NotEqual(Guid.Empty, message.Id);
        Assert.Equal((uint)256, message.FrameId);
        Assert.Equal("VehicleStatus", message.Name);
        Assert.Equal((ushort)8, message.LengthInBytes);
        Assert.Equal("Vector__XXX", message.Transmitter);
        Assert.Equal(2, message.Signals.Count);

        var firstSignal = message.Signals[0];
        Assert.Equal("VehicleSpeed", firstSignal.Name);
        Assert.Null(firstSignal.MultiplexerIndicator);
        Assert.Equal(0, firstSignal.StartBit);
        Assert.Equal(16, firstSignal.BitLength);
        Assert.Equal("little-endian", firstSignal.ByteOrder);
        Assert.Equal("unsigned", firstSignal.ValueType);
        Assert.Equal(0.1d, firstSignal.Factor);
        Assert.Equal(0d, firstSignal.Offset);
        Assert.Equal(0d, firstSignal.Minimum);
        Assert.Equal(250d, firstSignal.Maximum);
        Assert.Equal("km/h", firstSignal.Unit);
        Assert.Equal(["Vector__XXX", "Dashboard"], firstSignal.Receivers);
        Assert.Null(firstSignal.Comment);
    }

    [Fact]
    public async Task GetDefinitionAsync_AssignsSignalsOnlyToTheirOwnMessage()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var dbcContent = """
                         VERSION "1.0"

                         BO_ 256 VehicleStatus: 8 Vector__XXX
                          SG_ VehicleSpeed : 0|16@1+ (0.1,0) [0|250] "km/h" Vector__XXX

                         BO_ 300 EngineData: 8 Vector__XXX
                          SG_ EngineSpeed : 0|16@1+ (0.25,0) [0|8000] "rpm" Vector__XXX
                          SG_ OilTemp : 16|8@1+ (1,0) [0|200] "°C" Vector__XXX
                         """;
        var fileId = await UploadDbcContentAsync(service, dbcContent);

        // Act
        var result = await service.GetDefinitionAsync(fileId);

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Definition);
        Assert.Equal(2, result.Definition!.Messages.Count);

        var firstMessage = result.Definition.Messages[0];
        var secondMessage = result.Definition.Messages[1];

        Assert.Single(firstMessage.Signals);
        Assert.Equal("VehicleSpeed", firstMessage.Signals[0].Name);

        Assert.Equal(2, secondMessage.Signals.Count);
        Assert.Equal(["EngineSpeed", "OilTemp"], secondMessage.Signals.Select(signal => signal.Name).ToArray());
    }

    [Fact]
    public async Task GetDefinitionAsync_ReturnsNotFound_WhenFileDoesNotExist()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);

        // Act
        var result = await service.GetDefinitionAsync(Guid.NewGuid());

        // Assert
        Assert.True(result.NotFound);
        Assert.False(result.Succeeded);
        Assert.Null(result.Definition);
    }

    [Fact]
    public async Task GetDefinitionAsync_ReturnsSignalComments()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var dbcContent = """
                         VERSION "1.0"

                         BO_ 256 VehicleStatus: 8 Vector__XXX
                          SG_ VehicleSpeed : 0|16@1+ (0.1,0) [0|250] "km/h" Vector__XXX
                          SG_ EngineSpeed : 16|16@1+ (0.25,0) [0|8000] "rpm" Vector__XXX

                         CM_ SG_ 256 VehicleSpeed "Current vehicle speed";
                         """;
        var fileId = await UploadDbcContentAsync(service, dbcContent);

        // Act
        var result = await service.GetDefinitionAsync(fileId);

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Definition);

        var message = Assert.Single(result.Definition!.Messages);
        Assert.Equal("Current vehicle speed", message.Signals[0].Comment);
        Assert.Null(message.Signals[1].Comment);
    }

    [Fact]
    public async Task GetDefinitionAsync_ReturnsExtendedSignalValueTypes()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var dbcContent = """
                         VERSION "1.0"

                         BO_ 256 SensorData: 8 Vector__XXX
                          SG_ Temperature : 0|32@1+ (0.1,0) [0|250] "C" Vector__XXX
                          SG_ Pressure : 32|64@1+ (0.1,0) [0|250] "bar" Vector__XXX

                         SIG_VALTYPE_ 256 Temperature : 1;
                         SIG_VALTYPE_ 256 Pressure : 2;
                         """;
        var fileId = await UploadDbcContentAsync(service, dbcContent);

        // Act
        var result = await service.GetDefinitionAsync(fileId);

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Definition);

        var message = Assert.Single(result.Definition!.Messages);
        Assert.Equal("float", message.Signals[0].ValueType);
        Assert.Equal("double", message.Signals[1].ValueType);
    }

    [Fact]
    public async Task UploadAsync_ReturnsError_WhenDbcContentCannotBeParsed()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes("not a dbc file"));
        var file = new FormFile(stream, 0, stream.Length, "file", "invalid.dbc")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/octet-stream"
        };

        // Act
        var result = await service.UploadAsync(file);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Contains("file", result.Errors.Keys);
        Assert.Empty(dbContext.DbcFiles);
    }

    [Fact]
    public async Task UpdateMessageAsync_UpdatesFrameIdNameAndTransmitter()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var fileId = await UploadDbcContentAsync(
            service,
            """
            VERSION "1.0"

            BO_ 256 VehicleStatus: 8 Vector__XXX
             SG_ VehicleSpeed : 0|16@1+ (0.1,0) [0|250] "km/h" Vector__XXX
            """);
        var messageId = await dbContext.DbcMessages
            .Where(message => message.DbcFileId == fileId)
            .Select(message => message.Id)
            .SingleAsync();

        // Act
        var result = await service.UpdateMessageAsync(
            fileId,
            messageId,
            new UpdateDbcMessageRequest(512, "VehicleStatusNew", "Gateway"));

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Message);
        Assert.Equal((uint)512, result.Message!.FrameId);
        Assert.Equal("VehicleStatusNew", result.Message.Name);
        Assert.Equal("Gateway", result.Message.Transmitter);

        var savedMessage = await dbContext.DbcMessages.SingleAsync(message => message.Id == messageId);
        Assert.Equal(512, savedMessage.FrameId);
        Assert.Equal("VehicleStatusNew", savedMessage.Name);
        Assert.Equal("Gateway", savedMessage.Transmitter);
    }

    [Fact]
    public async Task UpdateMessageAsync_ReturnsError_WhenFrameIdAlreadyExistsInSameFile()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var fileId = await UploadDbcContentAsync(
            service,
            """
            VERSION "1.0"

            BO_ 256 VehicleStatus: 8 Vector__XXX
             SG_ VehicleSpeed : 0|16@1+ (0.1,0) [0|250] "km/h" Vector__XXX

            BO_ 300 EngineData: 8 Vector__XXX
             SG_ EngineSpeed : 0|16@1+ (0.25,0) [0|8000] "rpm" Vector__XXX
            """);
        var messageId = await dbContext.DbcMessages
            .Where(message => message.DbcFileId == fileId && message.FrameId == 256)
            .Select(message => message.Id)
            .SingleAsync();

        // Act
        var result = await service.UpdateMessageAsync(
            fileId,
            messageId,
            new UpdateDbcMessageRequest(300, "VehicleStatus", "Gateway"));

        // Assert
        Assert.False(result.Succeeded);
        Assert.Contains("frameId", result.Errors.Keys);

        var unchangedMessage = await dbContext.DbcMessages.SingleAsync(message => message.Id == messageId);
        Assert.Equal(256, unchangedMessage.FrameId);
    }

    [Fact]
    public async Task UpdateMessageAsync_ReturnsNotFound_WhenMessageDoesNotExist()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);
        var fileId = await UploadDbcContentAsync(
            service,
            """
            VERSION "1.0"

            BO_ 256 VehicleStatus: 8 Vector__XXX
             SG_ VehicleSpeed : 0|16@1+ (0.1,0) [0|250] "km/h" Vector__XXX
            """);

        // Act
        var result = await service.UpdateMessageAsync(
            fileId,
            Guid.NewGuid(),
            new UpdateDbcMessageRequest(512, "VehicleStatusNew", "Gateway"));

        // Assert
        Assert.True(result.NotFound);
        Assert.False(result.Succeeded);
        Assert.Null(result.Message);
    }

    [Fact]
    public async Task GetDefinitionAsync_ReturnsError_WhenFileHasNoNormalizedMessages()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var service = new DbcFileService(dbContext);

        dbContext.DbcFiles.Add(new Entities.DbcFile
        {
            OriginalFileName = "legacy.dbc",
            ContentType = "application/octet-stream",
            SizeInBytes = 12,
            Content = Encoding.UTF8.GetBytes("legacy content"),
            UploadedAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
        var fileId = await dbContext.DbcFiles.Select(file => file.Id).SingleAsync();

        // Act
        var result = await service.GetDefinitionAsync(fileId);

        // Assert
        Assert.False(result.Succeeded);
        Assert.False(result.NotFound);
        Assert.Null(result.Definition);
        Assert.Contains("file", result.Errors.Keys);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<Guid> UploadDbcContentAsync(DbcFileService service, string dbcContent)
    {
        await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(dbcContent));
        var file = new FormFile(stream, 0, stream.Length, "file", "vehicle.dbc")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/octet-stream"
        };

        var result = await service.UploadAsync(file);

        Assert.True(result.Succeeded);
        Assert.NotNull(result.File);

        return result.File!.Id;
    }
}
