namespace DbcViewer.Contracts.Auth;

public sealed record UserResponse(Guid Id, string Username, string Email, DateTime CreatedAtUtc);
