using DbcViewer.Data;
using Microsoft.EntityFrameworkCore;

namespace DbcViewer.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseApplicationPipeline(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseCors("frontend");
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        return app;
    }

    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS dbc_files (
                "Id" uuid PRIMARY KEY,
                "OriginalFileName" character varying(255) NOT NULL,
                "ContentType" character varying(255) NOT NULL,
                "SizeInBytes" bigint NOT NULL,
                "Content" bytea NOT NULL,
                "UploadedAtUtc" timestamp with time zone NOT NULL
            );

            CREATE TABLE IF NOT EXISTS dbc_messages (
                "Id" uuid PRIMARY KEY,
                "DbcFileId" uuid NOT NULL REFERENCES dbc_files("Id") ON DELETE CASCADE,
                "FrameId" bigint NOT NULL,
                "Name" character varying(255) NOT NULL,
                "LengthInBytes" smallint NOT NULL,
                "Transmitter" character varying(255) NOT NULL,
                "SortOrder" integer NOT NULL,
                CONSTRAINT "UX_dbc_messages_DbcFileId_FrameId" UNIQUE ("DbcFileId", "FrameId"),
                CONSTRAINT "UX_dbc_messages_DbcFileId_SortOrder" UNIQUE ("DbcFileId", "SortOrder")
            );

            CREATE TABLE IF NOT EXISTS dbc_signals (
                "Id" uuid PRIMARY KEY,
                "DbcMessageId" uuid NOT NULL REFERENCES dbc_messages("Id") ON DELETE CASCADE,
                "Name" character varying(255) NOT NULL,
                "MultiplexerIndicator" character varying(50) NULL,
                "StartBit" integer NOT NULL,
                "BitLength" integer NOT NULL,
                "ByteOrder" character varying(32) NOT NULL,
                "ValueType" character varying(32) NOT NULL,
                "Factor" double precision NOT NULL,
                "Offset" double precision NOT NULL,
                "Minimum" double precision NOT NULL,
                "Maximum" double precision NOT NULL,
                "Unit" character varying(100) NOT NULL,
                "Receivers" text NOT NULL,
                "Comment" text NULL,
                "SortOrder" integer NOT NULL,
                CONSTRAINT "UX_dbc_signals_DbcMessageId_SortOrder" UNIQUE ("DbcMessageId", "SortOrder")
            );

            CREATE INDEX IF NOT EXISTS "IX_dbc_signals_DbcMessageId_Name"
                ON dbc_signals ("DbcMessageId", "Name");

            ALTER TABLE dbc_messages
                ALTER COLUMN "FrameId" TYPE bigint;
            """);
    }
}
