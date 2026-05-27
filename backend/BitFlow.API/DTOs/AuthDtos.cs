namespace BitFlow.API.DTOs;

public sealed record RegisterRequest(string Name, string Email, string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record ResetPasswordRequest(string Email);

public sealed record UpdateUserRequest(string Name, string Email);

public sealed record UserDto(string Id, string Name, string Email, string CreatedAt);

public sealed record AuthSessionDto(string Token, UserDto User, string CreatedAt);
