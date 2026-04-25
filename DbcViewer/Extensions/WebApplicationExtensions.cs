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
            """);
    }
}
