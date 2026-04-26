using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using DbcViewer.Contracts.DbcFiles;

namespace DbcViewer.Services;

internal static partial class DbcDefinitionParser
{
    public static IReadOnlyList<DbcMessageResponse> Parse(byte[] content)
    {
        var dbcText = Encoding.UTF8.GetString(content);
        var messages = new List<MessageBuilder>();
        MessageBuilder? currentMessage = null;

        foreach (var rawLine in dbcText.Split(["\r\n", "\n"], StringSplitOptions.None))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var messageMatch = MessageLineRegex().Match(line);
            if (messageMatch.Success)
            {
                currentMessage = new MessageBuilder(
                    ParseUnsignedInteger(messageMatch.Groups["frameId"].Value),
                    messageMatch.Groups["name"].Value,
                    ParseUnsignedShort(messageMatch.Groups["length"].Value),
                    messageMatch.Groups["transmitter"].Value);

                messages.Add(currentMessage);
                continue;
            }

            var signalCommentMatch = SignalCommentLineRegex().Match(line);
            if (signalCommentMatch.Success)
            {
                ApplySignalComment(
                    messages,
                    ParseUnsignedInteger(signalCommentMatch.Groups["frameId"].Value),
                    signalCommentMatch.Groups["signalName"].Value,
                    UnescapeDbcString(signalCommentMatch.Groups["comment"].Value));

                continue;
            }

            var signalValueTypeMatch = SignalValueTypeLineRegex().Match(line);
            if (signalValueTypeMatch.Success)
            {
                ApplySignalValueType(
                    messages,
                    ParseUnsignedInteger(signalValueTypeMatch.Groups["frameId"].Value),
                    signalValueTypeMatch.Groups["signalName"].Value,
                    signalValueTypeMatch.Groups["valueType"].Value);

                continue;
            }

            if (!char.IsWhiteSpace(rawLine, 0))
            {
                currentMessage = null;
            }

            var signalMatch = SignalLineRegex().Match(line);
            if (!signalMatch.Success || currentMessage is null)
            {
                continue;
            }

            currentMessage.Signals.Add(new SignalBuilder(
                signalMatch.Groups["name"].Value,
                signalMatch.Groups["multiplexer"].Success ? signalMatch.Groups["multiplexer"].Value : null,
                ParseInteger(signalMatch.Groups["startBit"].Value),
                ParseInteger(signalMatch.Groups["bitLength"].Value),
                signalMatch.Groups["byteOrder"].Value == "1" ? "little-endian" : "big-endian",
                signalMatch.Groups["valueType"].Value == "-" ? "signed" : "unsigned",
                ParseDouble(signalMatch.Groups["factor"].Value),
                ParseDouble(signalMatch.Groups["offset"].Value),
                ParseDouble(signalMatch.Groups["minimum"].Value),
                ParseDouble(signalMatch.Groups["maximum"].Value),
                signalMatch.Groups["unit"].Value,
                ParseReceivers(signalMatch.Groups["receivers"].Value)));
        }

        if (messages.Count == 0)
        {
            throw new FormatException("The DBC content does not contain any parseable BO_ message definitions.");
        }

        return messages
            .Select(message => new DbcMessageResponse(
                Guid.Empty,
                message.FrameId,
                message.Name,
                message.LengthInBytes,
                message.Transmitter,
                message.Signals.Select(signal => signal.ToResponse()).ToArray()))
            .ToArray();
    }

    private static void ApplySignalComment(
        IReadOnlyList<MessageBuilder> messages,
        uint frameId,
        string signalName,
        string comment)
    {
        var message = messages.LastOrDefault(candidate => candidate.FrameId == frameId);
        var signal = message?.Signals.LastOrDefault(candidate => candidate.Name == signalName);
        signal?.SetComment(comment);
    }

    private static void ApplySignalValueType(
        IReadOnlyList<MessageBuilder> messages,
        uint frameId,
        string signalName,
        string valueTypeCode)
    {
        var message = messages.LastOrDefault(candidate => candidate.FrameId == frameId);
        var signal = message?.Signals.LastOrDefault(candidate => candidate.Name == signalName);
        signal?.SetValueType(ParseExtendedValueType(valueTypeCode));
    }

    private static IReadOnlyList<string> ParseReceivers(string receivers) =>
        receivers
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .ToArray();

    private static int ParseInteger(string value) =>
        int.Parse(value, NumberStyles.Integer, CultureInfo.InvariantCulture);

    private static uint ParseUnsignedInteger(string value) =>
        uint.Parse(value, NumberStyles.Integer, CultureInfo.InvariantCulture);

    private static ushort ParseUnsignedShort(string value) =>
        ushort.Parse(value, NumberStyles.Integer, CultureInfo.InvariantCulture);

    private static double ParseDouble(string value) =>
        double.Parse(value, NumberStyles.Float | NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture);

    [GeneratedRegex(
        @"^BO_\s+(?<frameId>\d+)\s+(?<name>\S+)\s*:\s*(?<length>\d+)\s+(?<transmitter>\S+)$",
        RegexOptions.CultureInvariant)]
    private static partial Regex MessageLineRegex();

    [GeneratedRegex(
        @"^SG_\s+(?<name>\S+?)(?:\s+(?<multiplexer>M|m\d+))?\s*:\s*(?<startBit>\d+)\|(?<bitLength>\d+)@(?<byteOrder>[01])(?<valueType>[+-])\s+\((?<factor>[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?),(?<offset>[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\)\s+\[(?<minimum>[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\|(?<maximum>[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\]\s+""(?<unit>[^""]*)""\s*(?<receivers>.*)$",
        RegexOptions.CultureInvariant)]
    private static partial Regex SignalLineRegex();

    [GeneratedRegex(
        @"^CM_\s+SG_\s+(?<frameId>\d+)\s+(?<signalName>\S+)\s+""(?<comment>(?:[^""\\]|\\.)*)""\s*;$",
        RegexOptions.CultureInvariant)]
    private static partial Regex SignalCommentLineRegex();

    [GeneratedRegex(
        @"^SIG_VALTYPE_\s+(?<frameId>\d+)\s+(?<signalName>\S+)\s*:\s*(?<valueType>[12])\s*;$",
        RegexOptions.CultureInvariant)]
    private static partial Regex SignalValueTypeLineRegex();

    private static string UnescapeDbcString(string value)
    {
        var builder = new StringBuilder(value.Length);

        for (var index = 0; index < value.Length; index++)
        {
            if (value[index] == '\\' && index + 1 < value.Length)
            {
                builder.Append(value[index + 1]);
                index++;
                continue;
            }

            builder.Append(value[index]);
        }

        return builder.ToString();
    }

    private static string ParseExtendedValueType(string valueTypeCode) => valueTypeCode switch
    {
        "1" => "float",
        "2" => "double",
        _ => throw new FormatException($"Unsupported DBC signal value type code '{valueTypeCode}'.")
    };

    private sealed class MessageBuilder(uint frameId, string name, ushort lengthInBytes, string transmitter)
    {
        public uint FrameId { get; } = frameId;
        public string Name { get; } = name;
        public ushort LengthInBytes { get; } = lengthInBytes;
        public string Transmitter { get; } = transmitter;
        public List<SignalBuilder> Signals { get; } = [];
    }

    private sealed class SignalBuilder(
        string name,
        string? multiplexerIndicator,
        int startBit,
        int bitLength,
        string byteOrder,
        string valueType,
        double factor,
        double offset,
        double minimum,
        double maximum,
        string unit,
        IReadOnlyList<string> receivers)
    {
        public string Name { get; } = name;
        public string? MultiplexerIndicator { get; } = multiplexerIndicator;
        public int StartBit { get; } = startBit;
        public int BitLength { get; } = bitLength;
        public string ByteOrder { get; } = byteOrder;
        public string ValueType { get; private set; } = valueType;
        public double Factor { get; } = factor;
        public double Offset { get; } = offset;
        public double Minimum { get; } = minimum;
        public double Maximum { get; } = maximum;
        public string Unit { get; } = unit;
        public IReadOnlyList<string> Receivers { get; } = receivers;
        public string? Comment { get; private set; }

        public void SetComment(string comment) => Comment = comment;
        public void SetValueType(string valueType) => ValueType = valueType;

        public DbcSignalResponse ToResponse() =>
            new(
                Guid.Empty,
                Name,
                MultiplexerIndicator,
                StartBit,
                BitLength,
                ByteOrder,
                ValueType,
                Factor,
                Offset,
                Minimum,
                Maximum,
                Unit,
                Receivers,
                Comment);
    }
}
