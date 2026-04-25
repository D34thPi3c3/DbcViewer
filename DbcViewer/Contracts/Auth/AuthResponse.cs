namespace DbcViewer.Contracts.Auth;

public sealed record AuthResponse(string Token, DateTime ExpiresAtUtc, UserResponse User);
