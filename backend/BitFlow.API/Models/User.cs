using System.ComponentModel.DataAnnotations;

namespace BitFlow.API.Models;

public sealed class User
{
    [MaxLength(64)]
    public string Id { get; set; } = IdFactory.Create("user");

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(320)]
    public string NormalizedEmail { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Project> Projects { get; } = new List<Project>();

    public ICollection<Component> Components { get; } = new List<Component>();

    public ICollection<UserSession> Sessions { get; } = new List<UserSession>();
}
