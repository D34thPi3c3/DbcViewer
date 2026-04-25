using DbcViewer.Entities;
using Microsoft.EntityFrameworkCore;

namespace DbcViewer.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<DbcFile> DbcFiles => Set<DbcFile>();

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
        });
    }
}
