using LibraryCatalog.Application.Authors;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryCatalog.Api.Controllers;

[ApiController]
[Route("api/v1/authors")]
[Produces("application/json")]
public class AuthorsController(AuthorService authors) : ControllerBase
{
    /// <summary>Lists authors, paged, searchable and sortable.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<PagedResult<AuthorResponse>>(StatusCodes.Status200OK)]
    public Task<PagedResult<AuthorResponse>> List(
        [FromQuery] AuthorListQuery query,
        CancellationToken cancellationToken) =>
        authors.ListAsync(query, cancellationToken);

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<AuthorResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<AuthorResponse> Get(Guid id, CancellationToken cancellationToken) =>
        authors.GetAsync(id, cancellationToken);

    [HttpPost]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType<AuthorResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthorResponse>> Create(
        CreateAuthorRequest request,
        CancellationToken cancellationToken)
    {
        var author = await authors.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = author.Id }, author);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateAuthorRequest request,
        CancellationToken cancellationToken)
    {
        await authors.UpdateAsync(id, request, cancellationToken);

        return NoContent();
    }

    /// <summary>Deletes an author. Refused with 409 while any book still references them.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await authors.DeleteAsync(id, cancellationToken);

        return NoContent();
    }
}
