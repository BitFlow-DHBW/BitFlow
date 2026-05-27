using System.ComponentModel.DataAnnotations;

namespace BitFlow.API.Models;

public sealed class Component
{
    [MaxLength(64)]
    public string Id { get; set; } = IdFactory.Create("component");

    [MaxLength(64)]
    public string OwnerId { get; set; } = string.Empty;

    public User? Owner { get; set; }

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string ComponentJson { get; set; } = "{}";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
