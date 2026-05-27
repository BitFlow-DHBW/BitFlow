using BitFlow.API.Data;
using BitFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BitFlow.API.Repositories;

public sealed class ComponentRepository(BitFlowDbContext dbContext)
{
    public async Task<IReadOnlyList<Component>> ListByOwnerAsync(string ownerId, CancellationToken cancellationToken)
    {
        return await dbContext.Components
            .Where(component => component.OwnerId == ownerId)
            .OrderBy(component => component.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<Component?> FindForOwnerAsync(string ownerId, string componentId, CancellationToken cancellationToken)
    {
        return dbContext.Components.FirstOrDefaultAsync(
            component => component.OwnerId == ownerId && component.Id == componentId,
            cancellationToken);
    }

    public void Add(Component component)
    {
        dbContext.Components.Add(component);
    }

    public void Remove(Component component)
    {
        dbContext.Components.Remove(component);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
