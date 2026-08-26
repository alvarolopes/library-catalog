using LibraryCatalog.Application.Books;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryCatalog.Api.Controllers;

[ApiController]
[Route("api/v1/books")]
[Produces("application/json")]
public class BooksController(BookService books) : ControllerBase
{
    /// <summary>
    /// Lists books, paged, searchable and sortable. <c>authorId</c> and <c>genreId</c>
    /// filter the list — this is what powers "books by this author" in the SPA.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<PagedResult<BookResponse>>(StatusCodes.Status200OK)]
    public Task<PagedResult<BookResponse>> List(
        [FromQuery] BookListQuery query,
        CancellationToken cancellationToken) =>
        books.ListAsync(query, cancellationToken);

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<BookResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public Task<BookResponse> Get(Guid id, CancellationToken cancellationToken) =>
        books.GetAsync(id, cancellationToken);

    [HttpPost]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType<BookResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BookResponse>> Create(
        CreateBookRequest request,
        CancellationToken cancellationToken)
    {
        var book = await books.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = book.Id }, book);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateBookRequest request,
        CancellationToken cancellationToken)
    {
        await books.UpdateAsync(id, request, cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Staff)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await books.DeleteAsync(id, cancellationToken);

        return NoContent();
    }
}
