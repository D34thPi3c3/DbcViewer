using System.ComponentModel.DataAnnotations;

namespace DbcViewer.Contracts.Auth;

public sealed class LoginRequest
{
    [Required]
    [MaxLength(255)]
    public string UsernameOrEmail { get; init; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;
}
