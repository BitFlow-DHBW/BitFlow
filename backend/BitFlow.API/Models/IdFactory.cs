using System.Security.Cryptography;

namespace BitFlow.API.Models;

public static class IdFactory
{
    public static string Create(string prefix)
    {
        return $"{prefix}_{Guid.NewGuid():N}";
    }

    public static string CreateToken(string prefix)
    {
        return $"{prefix}_{Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant()}";
    }
}
