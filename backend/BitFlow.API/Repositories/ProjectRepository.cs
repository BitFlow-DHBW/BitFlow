using BitFlow.API.Data;
using BitFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BitFlow.API.Repositories;

public sealed class ProjectRepository(BitFlowDbContext dbContext)
{
    public async Task<IReadOnlyList<Project>> ListByOwnerAsync(string ownerId, CancellationToken cancellationToken)
    {
        var ownerProjects = await dbContext.Projects
            .Where(project => project.OwnerId == ownerId)
            .ToListAsync(cancellationToken);

        return ownerProjects
            .OrderByDescending(project => project.UpdatedAt)
            .ToList();
    }

    public Task<Project?> FindForOwnerAsync(string ownerId, string projectId, CancellationToken cancellationToken)
    {
        return dbContext.Projects.FirstOrDefaultAsync(
            project => project.OwnerId == ownerId && project.Id == projectId,
            cancellationToken);
    }

    public void Add(Project project)
    {
        dbContext.Projects.Add(project);
    }

    public void Remove(Project project)
    {
        dbContext.Projects.Remove(project);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
