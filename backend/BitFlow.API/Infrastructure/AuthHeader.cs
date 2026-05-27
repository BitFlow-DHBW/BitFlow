namespace BitFlow.API.Infrastructure;

public static class AuthHeader
{
    public static string? GetBearerToken(string? authorizationHeader)
    {
        const string prefix = "Bearer ";

        if (string.IsNullOrWhiteSpace(authorizationHeader)
            || !authorizationHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return authorizationHeader[prefix.Length..].Trim();
    }
}
