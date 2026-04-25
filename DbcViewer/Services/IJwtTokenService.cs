using DbcViewer.Entities;

namespace DbcViewer.Services;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAtUtc) CreateToken(AppUser user);
}
