using System.ComponentModel.DataAnnotations;

namespace BitFlow.API.Models;

public sealed class UserSession
{
    [MaxLength(96)]
    public string Token { get; set; } = string.Empty;

    [MaxLength(64)]
    public string UserId { get; set; } = string.Empty;

    public User? User { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset ExpiresAt { get; set; } = DateTimeOffset.UtcNow.AddDays(14);
}
