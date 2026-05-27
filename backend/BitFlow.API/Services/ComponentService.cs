using System.Globalization;
using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;
using BitFlow.API.Repositories;

namespace BitFlow.API.Services;

public sealed class ComponentService(ComponentRepository components)
{
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
        var component = ToEntity(ownerId, CustomComponentPayload.Normalize(request));
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
        var createdAt = DateTimeOffset.Parse(dto.CreatedAt!, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);

        return new Component
        {
            Id = dto.Id!,
            OwnerId = ownerId,
            Name = dto.Name,
            CreatedAt = createdAt,
            ComponentJson = CustomComponentPayload.Serialize(dto)
        };
    }

    private static CustomComponentDto ToDto(Component component)
    {
        var dto = CustomComponentPayload.Deserialize(component.ComponentJson);
        if (dto is null)
        {
            throw new ApiException(StatusCodes.Status500InternalServerError, "Baustein konnte nicht gelesen werden.");
        }

        return dto;
    }
}
