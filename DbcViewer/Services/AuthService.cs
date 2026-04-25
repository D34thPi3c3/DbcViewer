using DbcViewer.Contracts.Auth;
using DbcViewer.Data;
using DbcViewer.Entities;
using DbcViewer.Extensions;
using DbcViewer.Services.Results;
using Microsoft.EntityFrameworkCore;

namespace DbcViewer.Services;

public sealed class AuthService(AppDbContext dbContext, IJwtTokenService tokenService) : IAuthService
{
    public async Task<RegisterUserResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedUsername = Normalize(request.Username);
        var normalizedEmail = Normalize(request.Email);

        var existingUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user =>
                    user.NormalizedUsername == normalizedUsername || user.NormalizedEmail == normalizedEmail,
                cancellationToken);

        if (existingUser is not null)
        {
            var errors = new Dictionary<string, string[]>();

            if (existingUser.NormalizedUsername == normalizedUsername)
            {
                errors["username"] = ["Username already exists."];
            }

            if (existingUser.NormalizedEmail == normalizedEmail)
            {
                errors["email"] = ["Email already exists."];
            }

            return new RegisterUserResult
            {
                Errors = errors
            };
        }

        var user = new AppUser
        {
            Username = request.Username.Trim(),
            NormalizedUsername = normalizedUsername,
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new RegisterUserResult
        {
            Response = CreateAuthResponse(user)
        };
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedIdentifier = Normalize(request.UsernameOrEmail);

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(existingUser =>
                    existingUser.NormalizedUsername == normalizedIdentifier ||
                    existingUser.NormalizedEmail == normalizedIdentifier,
                cancellationToken);

        if (user is null)
        {
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        return CreateAuthResponse(user);
    }

    public async Task<UserResponse?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(existingUser => existingUser.Id == userId, cancellationToken);

        return user?.ToResponse();
    }

    private AuthResponse CreateAuthResponse(AppUser user)
    {
        var (token, expiresAtUtc) = tokenService.CreateToken(user);
        return new AuthResponse(token, expiresAtUtc, user.ToResponse());
    }

    private static string Normalize(string value) => value.Trim().ToUpperInvariant();
}
