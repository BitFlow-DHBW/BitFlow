using BitFlow.API.DTOs;
using BitFlow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace BitFlow.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class UserController(UserService users) : AuthenticatedControllerBase(users)
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthSessionDto>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        return Created("/api/auth/me", await Users.RegisterAsync(request, cancellationToken));
    }

    [HttpPost("login")]
    public Task<AuthSessionDto> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        return Users.LoginAsync(request, cancellationToken);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await Users.LogoutAsync(GetBearerToken(), cancellationToken);
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<UserDto> Me(CancellationToken cancellationToken)
    {
        return UserService.ToUserDto(await RequireUserAsync(cancellationToken));
    }

    [HttpPut("me")]
    public async Task<UserDto> UpdateProfile(
        UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        return await Users.UpdateProfileAsync(user, request, cancellationToken);
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteAccount(CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        await Users.DeleteAccountAsync(user, cancellationToken);
        return NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await Users.ResetPasswordAsync(request, cancellationToken);
        return NoContent();
    }
}
