namespace DbcViewer.Entities;

public sealed class DbcMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DbcFileId { get; set; }
    public DbcFile DbcFile { get; set; } = null!;
    public int FrameId { get; set; }
    public string Name { get; set; } = string.Empty;
    public short LengthInBytes { get; set; }
    public string Transmitter { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public ICollection<DbcSignal> Signals { get; set; } = [];
}
