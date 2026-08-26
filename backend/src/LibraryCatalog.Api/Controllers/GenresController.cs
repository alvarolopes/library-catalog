using LibraryCatalog.Application.Common;
using LibraryCatalog.Application.Genres;
using LibraryCatalog.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryCatalog.Api.Controllers;

[ApiController]
[Route("api/v1/genres")]
[Produces("application/json")]
public class GenresController(GenreService genres) : ControllerBase
{
    /// <summary>Lists genres, paged, searchable and sortable.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<PagedResult<GenreResponse>>(StatusCodes.Status200OK)]
    public Task<PagedResult<GenreResponse>> List(
        [FromQuery] GenreListQuery query,
        CancellationToken cancellationToken) =>
        genres.ListAsync(query, cancellationToken);

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<GenreResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<GenreResponse> Get(Guid id, CancellationToken cancellationToken) =>
        genres.GetAsync(id, cancellationToken);

    [HttpPost]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType<GenreResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<GenreResponse>> Create(
        CreateGenreRequest request,
        CancellationToken cancellationToken)
    {
        var genre = await genres.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = genre.Id }, genre);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateGenreRequest request,
        CancellationToken cancellationToken)
    {
        await genres.UpdateAsync(id, request, cancellationToken);

        return NoContent();
    }

    /// <summary>Deletes a genre. Refused with 409 while any book still references it.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await genres.DeleteAsync(id, cancellationToken);

        return NoContent();
    }
}
