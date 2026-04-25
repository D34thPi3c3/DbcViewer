using DbcViewer.Contracts.Auth;

namespace DbcViewer.Services.Results;

public sealed class RegisterUserResult
{
    public AuthResponse? Response { get; init; }
    public Dictionary<string, string[]> Errors { get; init; } = [];
    public bool Succeeded => Response is not null && Errors.Count == 0;
}
