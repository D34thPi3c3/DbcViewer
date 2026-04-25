using DbcViewer.Contracts.Auth;
using DbcViewer.Entities;

namespace DbcViewer.Extensions;

public static class AuthMappings
{
    public static UserResponse ToResponse(this AppUser user) =>
        new(user.Id, user.Username, user.Email, user.CreatedAtUtc);
}
