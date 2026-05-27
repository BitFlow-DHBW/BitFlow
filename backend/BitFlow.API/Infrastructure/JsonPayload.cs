using System.Text.Json;

namespace BitFlow.API.Infrastructure;

public static class JsonPayload
{
    public const string EmptyObject = "{}";

    public const string EmptyArray = "[]";

    public static string Serialize(JsonElement? element, string fallback)
    {
        if (element is null || element.Value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
        {
            return fallback;
        }

        return element.Value.GetRawText();
    }

    public static JsonElement Parse(string json)
    {
        using var document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
