using BitFlow.API.DTOs;
using BitFlow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace BitFlow.API.Controllers;

[ApiController]
[Route("api/projects")]
public sealed class ProjectController(ProjectService projects, UserService users) : AuthenticatedControllerBase(users)
{
    [HttpGet]
    public async Task<IReadOnlyList<ProjectDto>> List(CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        return await projects.ListProjectsAsync(user.Id, cancellationToken);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create(
        CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var project = await projects.CreateProjectAsync(user.Id, request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = project.Id }, project);
    }

    [HttpGet("{id}")]
    public async Task<ProjectDto> Get(string id, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        return await projects.GetProjectAsync(user.Id, id, cancellationToken);
    }

    [HttpPut("{id}")]
    public async Task<ProjectDto> Update(
        string id,
        UpdateProjectRequest request,
        CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        return await projects.UpdateProjectAsync(user.Id, id, request, cancellationToken);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        await projects.DeleteProjectAsync(user.Id, id, cancellationToken);
        return NoContent();
    }

}
