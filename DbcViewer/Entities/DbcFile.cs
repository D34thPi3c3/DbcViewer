namespace DbcViewer.Entities;

public sealed class DbcFile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeInBytes { get; set; }
    public byte[] Content { get; set; } = [];
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<DbcMessage> Messages { get; set; } = [];
}
