using System.Text.Json;
using System.Text.Json.Nodes;
using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;

namespace BitFlow.API.Services;

internal static class CustomComponentPayload
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static CustomComponentDto Normalize(CustomComponentDto request)
    {
        Validate(request);

        var createdAt = DateTimeOffset.TryParse(request.CreatedAt, out var parsedCreatedAt)
            ? parsedCreatedAt
            : DateTimeOffset.UtcNow;

        return request with
        {
            Id = string.IsNullOrWhiteSpace(request.Id) ? IdFactory.Create("component") : request.Id.Trim(),
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            SourceCircuitId = string.IsNullOrWhiteSpace(request.SourceCircuitId) ? null : request.SourceCircuitId.Trim(),
            CreatedAt = DateTimeFormat.ToIsoString(createdAt)
        };
    }

    public static string Serialize(CustomComponentDto component)
    {
        return JsonSerializer.Serialize(component, JsonOptions);
    }

    public static CustomComponentDto? Deserialize(string json)
    {
        return JsonSerializer.Deserialize<CustomComponentDto>(json, JsonOptions);
    }

    public static JsonNode ToJsonNode(CustomComponentDto component)
    {
        return JsonSerializer.SerializeToNode(component, JsonOptions) ?? new JsonObject();
    }

    private static void Validate(CustomComponentDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Bausteinname darf nicht leer sein.");
        }

        if (request.InputLabels is null || request.InputLabels.Count == 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Baustein benötigt mindestens einen Eingang.");
        }

        if (request.OutputLabels is null || request.OutputLabels.Count == 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Baustein benötigt mindestens einen Ausgang.");
        }
    }
}
