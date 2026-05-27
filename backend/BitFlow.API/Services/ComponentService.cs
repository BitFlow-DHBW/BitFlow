using System.Text.Json;
using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;
using BitFlow.API.Repositories;

namespace BitFlow.API.Services;

public sealed class ComponentService(ComponentRepository components)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<CustomComponentDto>> ListComponentsAsync(
        string ownerId,
        CancellationToken cancellationToken)
    {
        var result = await components.ListByOwnerAsync(ownerId, cancellationToken);
        return result.Select(ToDto).ToList();
    }

    public async Task<CustomComponentDto> GetComponentAsync(
        string ownerId,
        string componentId,
        CancellationToken cancellationToken)
    {
        var component = await FindComponentOrThrowAsync(ownerId, componentId, cancellationToken);
        return ToDto(component);
    }

    public async Task<CustomComponentDto> CreateComponentAsync(
        string ownerId,
        CustomComponentDto request,
        CancellationToken cancellationToken)
    {
        Validate(request);

        var component = ToEntity(ownerId, request);
        components.Add(component);
        await components.SaveChangesAsync(cancellationToken);
        return ToDto(component);
    }

    public async Task DeleteComponentAsync(string ownerId, string componentId, CancellationToken cancellationToken)
    {
        var component = await FindComponentOrThrowAsync(ownerId, componentId, cancellationToken);
        components.Remove(component);
        await components.SaveChangesAsync(cancellationToken);
    }

    private async Task<Component> FindComponentOrThrowAsync(
        string ownerId,
        string componentId,
        CancellationToken cancellationToken)
    {
        var component = await components.FindForOwnerAsync(ownerId, componentId, cancellationToken);
        return component ?? throw new ApiException(StatusCodes.Status404NotFound, "Baustein wurde nicht gefunden.");
    }

    private static Component ToEntity(string ownerId, CustomComponentDto dto)
    {
        var createdAt = DateTimeOffset.TryParse(dto.CreatedAt, out var parsedCreatedAt)
            ? parsedCreatedAt
            : DateTimeOffset.UtcNow;

        var normalized = dto with
        {
            Id = string.IsNullOrWhiteSpace(dto.Id) ? IdFactory.Create("component") : dto.Id,
            CreatedAt = DateTimeFormat.ToIsoString(createdAt)
        };

        return new Component
        {
            Id = normalized.Id!,
            OwnerId = ownerId,
            Name = normalized.Name.Trim(),
            CreatedAt = createdAt,
            ComponentJson = JsonSerializer.Serialize(normalized, JsonOptions)
        };
    }

    private static CustomComponentDto ToDto(Component component)
    {
        var dto = JsonSerializer.Deserialize<CustomComponentDto>(component.ComponentJson, JsonOptions);
        if (dto is null)
        {
            throw new ApiException(StatusCodes.Status500InternalServerError, "Baustein konnte nicht gelesen werden.");
        }

        return dto;
    }

    private static void Validate(CustomComponentDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Bausteinname darf nicht leer sein.");
        }

        if (request.InputLabels.Count == 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Baustein benoetigt mindestens einen Eingang.");
        }

        if (request.OutputLabels.Count == 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Baustein benoetigt mindestens einen Ausgang.");
        }
    }
}
