using DbcViewer.Contracts.Auth;
using DbcViewer.Data;
using DbcViewer.Entities;
using DbcViewer.Services;
using Microsoft.EntityFrameworkCore;

namespace DbcViewer.Test.Services;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_CreatesUserWithHashedPassword_AndReturnsAuthResponse()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var tokenService = new FakeJwtTokenService();
        var authService = new AuthService(dbContext, tokenService);
        var request = new RegisterRequest
        {
            Username = " admin ",
            Email = " admin@example.com ",
            Password = "SuperSecret123"
        };

        // Act
        var result = await authService.RegisterAsync(request);
        var savedUser = await dbContext.Users.SingleAsync();

        // Assert
        Assert.True(result.Succeeded);
        Assert.NotNull(result.Response);
        Assert.Equal("fake-jwt-token", result.Response!.Token);
        Assert.Equal("admin", savedUser.Username);
        Assert.Equal("ADMIN", savedUser.NormalizedUsername);
        Assert.Equal("admin@example.com", savedUser.Email);
        Assert.Equal("ADMIN@EXAMPLE.COM", savedUser.NormalizedEmail);
        Assert.NotEqual(request.Password, savedUser.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify(request.Password, savedUser.PasswordHash));
    }

    [Fact]
    public async Task RegisterAsync_ReturnsErrors_WhenUsernameOrEmailAlreadyExists()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        dbContext.Users.Add(new AppUser
        {
            Username = "existing",
            NormalizedUsername = "EXISTING",
            Email = "existing@example.com",
            NormalizedEmail = "EXISTING@EXAMPLE.COM",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("secret")
        });
        await dbContext.SaveChangesAsync();

        var authService = new AuthService(dbContext, new FakeJwtTokenService());
        var request = new RegisterRequest
        {
            Username = "Existing",
            Email = "existing@example.com",
            Password = "AnotherSecret123"
        };

        // Act
        var result = await authService.RegisterAsync(request);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Null(result.Response);
        Assert.Contains("username", result.Errors.Keys);
        Assert.Contains("email", result.Errors.Keys);
    }

    [Fact]
    public async Task LoginAsync_ReturnsAuthResponse_WhenCredentialsAreValid()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        dbContext.Users.Add(new AppUser
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            NormalizedUsername = "ADMIN",
            Email = "admin@example.com",
            NormalizedEmail = "ADMIN@EXAMPLE.COM",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperSecret123"),
            CreatedAtUtc = new DateTime(2026, 1, 1, 10, 0, 0, DateTimeKind.Utc)
        });
        await dbContext.SaveChangesAsync();

        var authService = new AuthService(dbContext, new FakeJwtTokenService());

        // Act
        var response = await authService.LoginAsync(new LoginRequest
        {
            UsernameOrEmail = "admin@example.com",
            Password = "SuperSecret123"
        });

        // Assert
        Assert.NotNull(response);
        Assert.Equal("fake-jwt-token", response!.Token);
        Assert.Equal("admin", response.User.Username);
        Assert.Equal("admin@example.com", response.User.Email);
    }

    [Fact]
    public async Task LoginAsync_ReturnsNull_WhenPasswordIsInvalid()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        dbContext.Users.Add(new AppUser
        {
            Username = "admin",
            NormalizedUsername = "ADMIN",
            Email = "admin@example.com",
            NormalizedEmail = "ADMIN@EXAMPLE.COM",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperSecret123")
        });
        await dbContext.SaveChangesAsync();

        var authService = new AuthService(dbContext, new FakeJwtTokenService());

        // Act
        var response = await authService.LoginAsync(new LoginRequest
        {
            UsernameOrEmail = "admin",
            Password = "wrong-password"
        });

        // Assert
        Assert.Null(response);
    }

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsMappedUser_WhenUserExists()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var userId = Guid.NewGuid();
        dbContext.Users.Add(new AppUser
        {
            Id = userId,
            Username = "admin",
            NormalizedUsername = "ADMIN",
            Email = "admin@example.com",
            NormalizedEmail = "ADMIN@EXAMPLE.COM",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperSecret123"),
            CreatedAtUtc = new DateTime(2026, 1, 1, 10, 0, 0, DateTimeKind.Utc)
        });
        await dbContext.SaveChangesAsync();

        var authService = new AuthService(dbContext, new FakeJwtTokenService());

        // Act
        var user = await authService.GetCurrentUserAsync(userId);

        // Assert
        Assert.NotNull(user);
        Assert.Equal(userId, user!.Id);
        Assert.Equal("admin", user.Username);
        Assert.Equal("admin@example.com", user.Email);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private sealed class FakeJwtTokenService : IJwtTokenService
    {
        public (string Token, DateTime ExpiresAtUtc) CreateToken(AppUser user) =>
            ("fake-jwt-token", new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc));
    }
}
