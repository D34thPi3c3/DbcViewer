namespace DbcViewer.Contracts.DbcFiles;

public sealed record DbcSignalResponse(
    string Name,
    string? MultiplexerIndicator,
    int StartBit,
    int BitLength,
    string ByteOrder,
    string ValueType,
    double Factor,
    double Offset,
    double Minimum,
    double Maximum,
    string Unit,
    IReadOnlyList<string> Receivers,
    string? Comment);
