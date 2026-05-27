using BitFlow.API.DTOs;
using BitFlow.API.Infrastructure;
using BitFlow.API.Models;
using BitFlow.API.Repositories;

namespace BitFlow.API.Services;

public sealed class UserService(UserRepository users)
{
    public async Task<AuthSessionDto> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        ValidateCredentials(request.Name, request.Email, request.Password);

        var normalizedEmail = NormalizeEmail(request.Email);
        if (await users.FindByEmailAsync(normalizedEmail, cancellationToken) is not null)
        {
            throw new ApiException(StatusCodes.Status409Conflict, "Fuer diese E-Mail existiert bereits ein Konto.");
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            PasswordHash = PasswordHasher.Hash(request.Password),
            CreatedAt = now
        };

        users.Add(user);
        var session = CreateSession(user.Id, now);
        users.AddSession(session);
        await users.SaveChangesAsync(cancellationToken);

        return ToSessionDto(session.Token, user, session.CreatedAt);
    }

    public async Task<AuthSessionDto> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await users.FindByEmailAsync(normalizedEmail, cancellationToken);

        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "E-Mail oder Passwort ist nicht korrekt.");
        }

        var now = DateTimeOffset.UtcNow;
        var session = CreateSession(user.Id, now);
        users.AddSession(session);
        await users.SaveChangesAsync(cancellationToken);

        return ToSessionDto(session.Token, user, session.CreatedAt);
    }

    public async Task<User?> FindUserByTokenAsync(string? token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var session = await users.FindSessionAsync(token, cancellationToken);
        if (session is null || session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        return session.User;
    }

    public async Task LogoutAsync(string? token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return;
        }

        var session = await users.FindSessionAsync(token, cancellationToken);
        if (session is null)
        {
            return;
        }

        users.RemoveSession(session);
        await users.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserDto> UpdateProfileAsync(User user, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Name darf nicht leer sein.");
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@', StringComparison.Ordinal))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "E-Mail ist ungueltig.");
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var existing = await users.FindByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is not null && existing.Id != user.Id)
        {
            throw new ApiException(StatusCodes.Status409Conflict, "Fuer diese E-Mail existiert bereits ein Konto.");
        }

        user.Name = request.Name.Trim();
        user.Email = request.Email.Trim();
        user.NormalizedEmail = normalizedEmail;
        await users.SaveChangesAsync(cancellationToken);

        return ToUserDto(user);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await users.FindByEmailAsync(NormalizeEmail(request.Email), cancellationToken);
        if (user is null)
        {
            throw new ApiException(StatusCodes.Status404NotFound, "Fuer diese E-Mail wurde kein Konto gefunden.");
        }
    }

    public async Task DeleteAccountAsync(User user, CancellationToken cancellationToken)
    {
        users.Remove(user);
        await users.SaveChangesAsync(cancellationToken);
    }

    public static UserDto ToUserDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Name,
            user.Email,
            DateTimeFormat.ToIsoString(user.CreatedAt));
    }

    private static void ValidateCredentials(string name, string email, string password)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Name darf nicht leer sein.");
        }

        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@', StringComparison.Ordinal))
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "E-Mail ist ungueltig.");
        }

        if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Passwort muss mindestens 6 Zeichen lang sein.");
        }
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToUpperInvariant();
    }

    private static UserSession CreateSession(string userId, DateTimeOffset now)
    {
        return new UserSession
        {
            Token = IdFactory.CreateToken("session"),
            UserId = userId,
            CreatedAt = now,
            ExpiresAt = now.AddDays(14)
        };
    }

    private static AuthSessionDto ToSessionDto(string token, User user, DateTimeOffset createdAt)
    {
        return new AuthSessionDto(token, ToUserDto(user), DateTimeFormat.ToIsoString(createdAt));
    }
}
