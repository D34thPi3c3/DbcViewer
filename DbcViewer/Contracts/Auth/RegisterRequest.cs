using System.ComponentModel.DataAnnotations;

namespace DbcViewer.Contracts.Auth;

public sealed class RegisterRequest
{
    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    public string Username { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;
}
