using DbcViewer.Entities;
using Microsoft.EntityFrameworkCore;

namespace DbcViewer.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<DbcFile> DbcFiles => Set<DbcFile>();
    public DbSet<DbcMessage> DbcMessages => Set<DbcMessage>();
    public DbSet<DbcSignal> DbcSignals => Set<DbcSignal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(user => user.Id);

            entity.Property(user => user.Username)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.NormalizedUsername)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.NormalizedEmail)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.PasswordHash)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.CreatedAtUtc)
                .IsRequired();

            entity.HasIndex(user => user.NormalizedUsername).IsUnique();
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
        });

        modelBuilder.Entity<DbcFile>(entity =>
        {
            entity.ToTable("dbc_files");
            entity.HasKey(file => file.Id);

            entity.Property(file => file.OriginalFileName)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(file => file.ContentType)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(file => file.SizeInBytes)
                .IsRequired();

            entity.Property(file => file.Content)
                .IsRequired();

            entity.Property(file => file.UploadedAtUtc)
                .IsRequired();

            entity.HasMany(file => file.Messages)
                .WithOne(message => message.DbcFile)
                .HasForeignKey(message => message.DbcFileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DbcMessage>(entity =>
        {
            entity.ToTable("dbc_messages");
            entity.HasKey(message => message.Id);

            entity.Property(message => message.FrameId)
                .IsRequired();

            entity.Property(message => message.Name)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(message => message.LengthInBytes)
                .IsRequired();

            entity.Property(message => message.Transmitter)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(message => message.SortOrder)
                .IsRequired();

            entity.HasIndex(message => new { message.DbcFileId, message.FrameId })
                .IsUnique();

            entity.HasIndex(message => new { message.DbcFileId, message.SortOrder })
                .IsUnique();

            entity.HasMany(message => message.Signals)
                .WithOne(signal => signal.DbcMessage)
                .HasForeignKey(signal => signal.DbcMessageId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DbcSignal>(entity =>
        {
            entity.ToTable("dbc_signals");
            entity.HasKey(signal => signal.Id);

            entity.Property(signal => signal.Name)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(signal => signal.MultiplexerIndicator)
                .HasMaxLength(50);

            entity.Property(signal => signal.StartBit)
                .IsRequired();

            entity.Property(signal => signal.BitLength)
                .IsRequired();

            entity.Property(signal => signal.ByteOrder)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(signal => signal.ValueType)
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(signal => signal.Factor)
                .IsRequired();

            entity.Property(signal => signal.Offset)
                .IsRequired();

            entity.Property(signal => signal.Minimum)
                .IsRequired();

            entity.Property(signal => signal.Maximum)
                .IsRequired();

            entity.Property(signal => signal.Unit)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(signal => signal.Receivers)
                .IsRequired();

            entity.Property(signal => signal.Comment);

            entity.Property(signal => signal.SortOrder)
                .IsRequired();

            entity.HasIndex(signal => new { signal.DbcMessageId, signal.Name });

            entity.HasIndex(signal => new { signal.DbcMessageId, signal.SortOrder })
                .IsUnique();
        });
    }
}
