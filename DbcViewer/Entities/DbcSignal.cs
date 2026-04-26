namespace DbcViewer.Entities;

public sealed class DbcSignal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DbcMessageId { get; set; }
    public DbcMessage DbcMessage { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? MultiplexerIndicator { get; set; }
    public int StartBit { get; set; }
    public int BitLength { get; set; }
    public string ByteOrder { get; set; } = string.Empty;
    public string ValueType { get; set; } = string.Empty;
    public double Factor { get; set; }
    public double Offset { get; set; }
    public double Minimum { get; set; }
    public double Maximum { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Receivers { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public int SortOrder { get; set; }
}
