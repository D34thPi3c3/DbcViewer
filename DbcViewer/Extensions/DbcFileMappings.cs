using DbcViewer.Contracts.DbcFiles;
using DbcViewer.Entities;

namespace DbcViewer.Extensions;

public static class DbcFileMappings
{
    public static DbcFileResponse ToResponse(this DbcFile file) =>
        new(file.Id, file.OriginalFileName, file.ContentType, file.SizeInBytes, file.UploadedAtUtc);

    public static DbcDefinitionResponse ToDefinitionResponse(
        this DbcFile file,
        IReadOnlyList<DbcMessageResponse> messages) =>
        new(file.Id, file.OriginalFileName, file.UploadedAtUtc, messages);

    public static DbcDefinitionResponse ToDefinitionResponse(this DbcFile file) =>
        new(
            file.Id,
            file.OriginalFileName,
            file.UploadedAtUtc,
            file.Messages
                .OrderBy(message => message.SortOrder)
                .Select(message => message.ToResponse())
                .ToArray());

    public static DbcMessageResponse ToResponse(this DbcMessage message) =>
        new(
            checked((uint)message.FrameId),
            message.Name,
            (ushort)message.LengthInBytes,
            message.Transmitter,
            message.Signals
                .OrderBy(signal => signal.SortOrder)
                .Select(signal => signal.ToResponse())
                .ToArray());

    public static DbcSignalResponse ToResponse(this DbcSignal signal) =>
        new(
            signal.Name,
            signal.MultiplexerIndicator,
            signal.StartBit,
            signal.BitLength,
            signal.ByteOrder,
            signal.ValueType,
            signal.Factor,
            signal.Offset,
            signal.Minimum,
            signal.Maximum,
            signal.Unit,
            ParseReceivers(signal.Receivers),
            signal.Comment);

    public static List<DbcMessage> ToEntities(
        this IReadOnlyList<DbcMessageResponse> messages,
        Guid dbcFileId) =>
        messages
            .Select((message, messageIndex) => new DbcMessage
            {
                DbcFileId = dbcFileId,
                FrameId = message.FrameId,
                Name = message.Name,
                LengthInBytes = checked((short)message.LengthInBytes),
                Transmitter = message.Transmitter,
                SortOrder = messageIndex,
                Signals = message.Signals
                    .Select((signal, signalIndex) => signal.ToEntity(signalIndex))
                    .ToList()
            })
            .ToList();

    private static DbcSignal ToEntity(this DbcSignalResponse signal, int sortOrder) =>
        new()
        {
            Name = signal.Name,
            MultiplexerIndicator = signal.MultiplexerIndicator,
            StartBit = signal.StartBit,
            BitLength = signal.BitLength,
            ByteOrder = signal.ByteOrder,
            ValueType = signal.ValueType,
            Factor = signal.Factor,
            Offset = signal.Offset,
            Minimum = signal.Minimum,
            Maximum = signal.Maximum,
            Unit = signal.Unit,
            Receivers = string.Join(",", signal.Receivers),
            Comment = signal.Comment,
            SortOrder = sortOrder
        };

    private static IReadOnlyList<string> ParseReceivers(string receivers) =>
        receivers
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .ToArray();
}
