namespace BitFlow.API.Infrastructure;

public static class DateTimeFormat
{
    public static string ToIsoString(DateTimeOffset value)
    {
        return value.UtcDateTime.ToString("O");
    }
}
