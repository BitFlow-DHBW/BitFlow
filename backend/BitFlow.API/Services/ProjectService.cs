using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;
using BitFlow.API.Repositories;

namespace BitFlow.API.Services;

public sealed class ProjectService(ProjectRepository projects)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<IReadOnlyList<ProjectDto>> ListProjectsAsync(string ownerId, CancellationToken cancellationToken)
    {
        var result = await projects.ListByOwnerAsync(ownerId, cancellationToken);
        return result.Select(ToDto).ToList();
    }

    public async Task<ProjectDto> GetProjectAsync(string ownerId, string projectId, CancellationToken cancellationToken)
    {
        var project = await FindProjectOrThrowAsync(ownerId, projectId, cancellationToken);
        return ToDto(project);
    }

    public async Task<ProjectDto> CreateProjectAsync(string ownerId, CreateProjectRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Projektname darf nicht leer sein.");
        }

        var now = DateTimeOffset.UtcNow;
        var project = new Project
        {
            OwnerId = ownerId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            CircuitJson = SerializeCircuit(request.Circuit, CreateEmptyCircuit(request.Name.Trim())),
            InputSignalsJson = JsonPayload.Serialize(request.InputSignals, JsonPayload.EmptyObject),
            CustomComponentsJson = JsonPayload.Serialize(request.CustomComponents, JsonPayload.EmptyArray),
            CreatedAt = now,
            UpdatedAt = now
        };

        projects.Add(project);
        await projects.SaveChangesAsync(cancellationToken);
        return ToDto(project);
    }

    public async Task<ProjectDto> UpdateProjectAsync(
        string ownerId,
        string projectId,
        UpdateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var project = await FindProjectOrThrowAsync(ownerId, projectId, cancellationToken);

        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Projektname darf nicht leer sein.");
            }

            project.Name = request.Name.Trim();
        }

        if (request.Description is not null)
        {
            project.Description = request.Description.Trim();
        }

        if (request.Circuit is not null)
        {
            project.CircuitJson = SerializeCircuit(request.Circuit, project.CircuitJson);
        }

        if (request.InputSignals is not null)
        {
            project.InputSignalsJson = JsonPayload.Serialize(request.InputSignals, project.InputSignalsJson);
        }

        if (request.CustomComponents is not null)
        {
            project.CustomComponentsJson = JsonPayload.Serialize(request.CustomComponents, project.CustomComponentsJson);
        }

        project.UpdatedAt = DateTimeOffset.UtcNow;
        await projects.SaveChangesAsync(cancellationToken);
        return ToDto(project);
    }

    public async Task<ProjectDto> AddCustomComponentAsync(
        string ownerId,
        string projectId,
        CustomComponentDto request,
        CancellationToken cancellationToken)
    {
        var project = await FindProjectOrThrowAsync(ownerId, projectId, cancellationToken);
        var component = CustomComponentPayload.Normalize(request);

        project.CustomComponentsJson = UpsertComponent(project.CustomComponentsJson, component);
        project.CircuitJson = UpsertCircuitComponent(project.CircuitJson, component);
        project.UpdatedAt = DateTimeOffset.UtcNow;

        await projects.SaveChangesAsync(cancellationToken);
        return ToDto(project);
    }

    public async Task DeleteProjectAsync(string ownerId, string projectId, CancellationToken cancellationToken)
    {
        var project = await FindProjectOrThrowAsync(ownerId, projectId, cancellationToken);
        projects.Remove(project);
        await projects.SaveChangesAsync(cancellationToken);
    }

    private async Task<Project> FindProjectOrThrowAsync(
        string ownerId,
        string projectId,
        CancellationToken cancellationToken)
    {
        var project = await projects.FindForOwnerAsync(ownerId, projectId, cancellationToken);
        return project ?? throw new ApiException(StatusCodes.Status404NotFound, "Projekt wurde nicht gefunden.");
    }

    private static ProjectDto ToDto(Project project)
    {
        return new ProjectDto(
            project.Id,
            project.OwnerId,
            project.Name,
            project.Description,
            JsonPayload.Parse(NormalizeCircuitJson(project.CircuitJson)),
            JsonPayload.Parse(project.InputSignalsJson),
            JsonPayload.Parse(project.CustomComponentsJson),
            DateTimeFormat.ToIsoString(project.CreatedAt),
            DateTimeFormat.ToIsoString(project.UpdatedAt));
    }

    private static string CreateEmptyCircuit(string name)
    {
        return JsonSerializer.Serialize(new
        {
            id = IdFactory.Create("circuit"),
            name,
            version = 1,
            gates = Array.Empty<object>(),
            wires = Array.Empty<object>(),
            customComponents = Array.Empty<object>()
        }, JsonOptions);
    }

    private static string SerializeCircuit(JsonElement? circuit, string fallback)
    {
        return NormalizeCircuitJson(JsonPayload.Serialize(circuit, fallback));
    }

    private static string NormalizeCircuitJson(string circuitJson)
    {
        return JsonSerializer.Serialize(ReadCircuitPayload(circuitJson), JsonOptions);
    }

    private static string UpsertComponent(string customComponentsJson, CustomComponentDto component)
    {
        var components = ParseArray(customComponentsJson);
        UpsertComponentNode(components, component);
        return components.ToJsonString(JsonOptions);
    }

    private static string UpsertCircuitComponent(string circuitJson, CustomComponentDto component)
    {
        var circuit = ParseObject(NormalizeCircuitJson(circuitJson));
        var components = circuit["customComponents"] as JsonArray;

        if (components is null)
        {
            components = new JsonArray();
            circuit["customComponents"] = components;
        }

        UpsertComponentNode(components, component);
        return circuit.ToJsonString(JsonOptions);
    }

    private static JsonArray ParseArray(string json)
    {
        try
        {
            return JsonNode.Parse(json) as JsonArray ?? new JsonArray();
        }
        catch (JsonException)
        {
            return new JsonArray();
        }
    }

    private static JsonObject ParseObject(string json)
    {
        try
        {
            return JsonNode.Parse(json) as JsonObject ?? new JsonObject();
        }
        catch (JsonException)
        {
            return new JsonObject();
        }
    }

    private static void UpsertComponentNode(JsonArray components, CustomComponentDto component)
    {
        for (var index = 0; index < components.Count; index++)
        {
            if (components[index] is JsonObject existingComponent
                && string.Equals(ReadString(existingComponent, "id"), component.Id, StringComparison.Ordinal))
            {
                components[index] = CustomComponentPayload.ToJsonNode(component);
                return;
            }
        }

        components.Add(CustomComponentPayload.ToJsonNode(component));
    }

    private static string? ReadString(JsonObject jsonObject, string propertyName)
    {
        return jsonObject.TryGetPropertyValue(propertyName, out var value) ? value?.ToString() : null;
    }

    private static CircuitPayload ReadCircuitPayload(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<CircuitPayload>(json, JsonOptions)
                ?? throw new JsonException("Circuit payload is empty.");
        }
        catch (JsonException exception)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                $"Schaltungsdaten sind ungueltig: {exception.Message}");
        }
    }

    private sealed class CircuitPayload
    {
        public string Id { get; init; } = IdFactory.Create("circuit");

        public string Name { get; init; } = string.Empty;

        public int Version { get; init; } = 1;

        public JsonElement[] Gates { get; init; } = [];

        public JsonElement[] Wires { get; init; } = [];

        public JsonElement[]? Annotations { get; init; }

        public CircuitNetPayload[]? Nets { get; init; }

        public JsonElement[] CustomComponents { get; init; } = [];
    }

    private sealed class CircuitNetPayload
    {
        public string Id { get; init; } = string.Empty;

        public string Name { get; init; } = string.Empty;

        public string[] PinIds { get; init; } = [];

        public string[] WireIds { get; init; } = [];
    }
}
