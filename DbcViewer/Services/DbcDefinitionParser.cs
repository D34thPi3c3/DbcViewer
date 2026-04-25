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

            if (!char.IsWhiteSpace(rawLine, 0))
            {
                currentMessage = null;
            }

            var signalMatch = SignalLineRegex().Match(line);
            if (!signalMatch.Success || currentMessage is null)
            {
                continue;
            }

            currentMessage.Signals.Add(new DbcSignalResponse(
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
                message.FrameId,
                message.Name,
                message.LengthInBytes,
                message.Transmitter,
                message.Signals))
            .ToArray();
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

    private sealed class MessageBuilder(uint frameId, string name, ushort lengthInBytes, string transmitter)
    {
        public uint FrameId { get; } = frameId;
        public string Name { get; } = name;
        public ushort LengthInBytes { get; } = lengthInBytes;
        public string Transmitter { get; } = transmitter;
        public List<DbcSignalResponse> Signals { get; } = [];
    }
}
