using System.ComponentModel.DataAnnotations;

namespace BitFlow.API.Models;

public sealed class Project
{
    [MaxLength(64)]
    public string Id { get; set; } = IdFactory.Create("project");

    [MaxLength(64)]
    public string OwnerId { get; set; } = string.Empty;

    public User? Owner { get; set; }

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    public string CircuitJson { get; set; } = "{}";

    public string InputSignalsJson { get; set; } = "{}";

    public string CustomComponentsJson { get; set; } = "[]";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
