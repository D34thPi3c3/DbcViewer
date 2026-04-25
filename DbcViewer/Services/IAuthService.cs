using DbcViewer.Contracts.Auth;
using DbcViewer.Services.Results;

namespace DbcViewer.Services;

public interface IAuthService
{
    Task<RegisterUserResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<UserResponse?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
