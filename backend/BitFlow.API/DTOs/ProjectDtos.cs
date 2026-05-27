using System.Text.Json;

namespace BitFlow.API.DTOs;

public sealed record CreateProjectRequest(
    string Name,
    string? Description,
    JsonElement? Circuit,
    JsonElement? InputSignals,
    JsonElement? CustomComponents);

public sealed record UpdateProjectRequest(
    string? Name,
    string? Description,
    JsonElement? Circuit,
    JsonElement? InputSignals,
    JsonElement? CustomComponents);

public sealed record ProjectDto(
    string Id,
    string OwnerId,
    string Name,
    string Description,
    JsonElement Circuit,
    JsonElement InputSignals,
    JsonElement CustomComponents,
    string CreatedAt,
    string UpdatedAt);
