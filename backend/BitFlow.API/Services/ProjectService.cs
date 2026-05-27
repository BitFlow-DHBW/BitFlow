using System.Text.Json;
using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;
using BitFlow.API.Repositories;

namespace BitFlow.API.Services;

public sealed class ProjectService(ProjectRepository projects)
{
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
            CircuitJson = JsonPayload.Serialize(request.Circuit, CreateEmptyCircuit(request.Name.Trim())),
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
            project.CircuitJson = JsonPayload.Serialize(request.Circuit, project.CircuitJson);
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
            JsonPayload.Parse(project.CircuitJson),
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
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }
}
