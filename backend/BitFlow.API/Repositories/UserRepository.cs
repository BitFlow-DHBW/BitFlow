using BitFlow.API.Data;
using BitFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BitFlow.API.Repositories;

public sealed class UserRepository(BitFlowDbContext dbContext)
{
    public Task<User?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        return dbContext.Users.FirstOrDefaultAsync(
            user => user.NormalizedEmail == normalizedEmail,
            cancellationToken);
    }

    public Task<User?> FindByIdAsync(string userId, CancellationToken cancellationToken)
    {
        return dbContext.Users.FirstOrDefaultAsync(user => user.Id == userId, cancellationToken);
    }

    public Task<UserSession?> FindSessionAsync(string token, CancellationToken cancellationToken)
    {
        return dbContext.Sessions
            .Include(session => session.User)
            .FirstOrDefaultAsync(session => session.Token == token, cancellationToken);
    }

    public void Add(User user)
    {
        dbContext.Users.Add(user);
    }

    public void AddSession(UserSession session)
    {
        dbContext.Sessions.Add(session);
    }

    public void Remove(User user)
    {
        dbContext.Users.Remove(user);
    }

    public void RemoveSession(UserSession session)
    {
        dbContext.Sessions.Remove(session);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
