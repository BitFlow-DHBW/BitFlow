using BitFlow.API.Infrastructure;
using BitFlow.API.Models;
using BitFlow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace BitFlow.API.Controllers;

public abstract class AuthenticatedControllerBase(UserService users) : ControllerBase
{
    protected UserService Users { get; } = users;

    protected async Task<User> RequireUserAsync(CancellationToken cancellationToken)
    {
        var token = AuthHeader.GetBearerToken(Request.Headers.Authorization);
        var user = await Users.FindUserByTokenAsync(token, cancellationToken);
        return user ?? throw new ApiException(StatusCodes.Status401Unauthorized, "Nicht authentifiziert.");
    }

    protected string? GetBearerToken()
    {
        return AuthHeader.GetBearerToken(Request.Headers.Authorization);
    }
}
