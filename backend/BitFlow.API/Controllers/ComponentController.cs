using BitFlow.API.DTOs;
using BitFlow.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace BitFlow.API.Controllers;

[ApiController]
[Route("api/components")]
public sealed class ComponentController(ComponentService components, UserService users) : AuthenticatedControllerBase(users)
{
    [HttpGet]
    public async Task<IReadOnlyList<CustomComponentDto>> List(CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        return await components.ListComponentsAsync(user.Id, cancellationToken);
    }

    [HttpPost]
    public async Task<ActionResult<CustomComponentDto>> Create(
        CustomComponentDto request,
        CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        var component = await components.CreateComponentAsync(user.Id, request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = component.Id }, component);
    }

    [HttpGet("{id}")]
    public async Task<CustomComponentDto> Get(string id, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        return await components.GetComponentAsync(user.Id, id, cancellationToken);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var user = await RequireUserAsync(cancellationToken);
        await components.DeleteComponentAsync(user.Id, id, cancellationToken);
        return NoContent();
    }

}
