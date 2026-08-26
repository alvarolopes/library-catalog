using LibraryCatalog.Application.Authors;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Application.Genres;

namespace LibraryCatalog.Application.Books;

public record CreateBookRequest(
    string Title,
    string? Isbn,
    int? PublicationYear,
    Guid AuthorId,
    Guid GenreId);

public record UpdateBookRequest(
    string Title,
    string? Isbn,
    int? PublicationYear,
    Guid AuthorId,
    Guid GenreId);

/// <summary>
/// Embeds the resolved author and genre rather than returning bare ids, so the
/// client renders a book list without a second round trip per row.
/// </summary>
public record BookResponse(
    Guid Id,
    string Title,
    string? Isbn,
    int? PublicationYear,
    AuthorSummary Author,
    GenreSummary Genre,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public class BookListQuery : PageQuery
{
    public Guid? AuthorId { get; init; }
    public Guid? GenreId { get; init; }
}
