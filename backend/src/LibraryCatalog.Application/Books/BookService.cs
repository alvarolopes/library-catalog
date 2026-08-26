using LibraryCatalog.Application.Authors;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Application.Genres;
using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Repositories;

namespace LibraryCatalog.Application.Books;

public class BookService(
    BookRepository books,
    AuthorRepository authors,
    GenreRepository genres)
{
    private const string ResourceName = "book";

    public async Task<PagedResult<BookResponse>> ListAsync(
        BookListQuery query,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await books.ListAsync(
            query.Search,
            query.AuthorId,
            query.GenreId,
            query.SortBy,
            query.SortDir == SortDirection.Desc,
            query.Skip,
            query.EffectivePageSize,
            cancellationToken);

        return new PagedResult<BookResponse>
        {
            Items = [.. items.Select(ToResponse)],
            Page = query.Page,
            PageSize = query.EffectivePageSize,
            TotalItems = totalCount
        };
    }

    public async Task<BookResponse> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await books.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        return ToResponse(book);
    }

    public async Task<BookResponse> CreateAsync(
        CreateBookRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureReferencesExistAsync(request.AuthorId, request.GenreId, cancellationToken);

        var isbn = NormalizeIsbn(request.Isbn);
        await EnsureIsbnIsFreeAsync(isbn, null, cancellationToken);

        var book = new Book
        {
            Title = request.Title.Trim(),
            Isbn = isbn,
            PublicationYear = request.PublicationYear,
            AuthorId = request.AuthorId,
            GenreId = request.GenreId
        };

        books.Add(book);
        await books.SaveChangesAsync(cancellationToken);

        // Re-read so the response carries the resolved author and genre.
        return await GetAsync(book.Id, cancellationToken);
    }

    public async Task UpdateAsync(
        Guid id,
        UpdateBookRequest request,
        CancellationToken cancellationToken = default)
    {
        var book = await books.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        await EnsureReferencesExistAsync(request.AuthorId, request.GenreId, cancellationToken);

        var isbn = NormalizeIsbn(request.Isbn);
        await EnsureIsbnIsFreeAsync(isbn, id, cancellationToken);

        book.Title = request.Title.Trim();
        book.Isbn = isbn;
        book.PublicationYear = request.PublicationYear;
        book.AuthorId = request.AuthorId;
        book.GenreId = request.GenreId;

        await books.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await books.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        // Nothing depends on a book, so this delete is unconditional.
        books.Remove(book);
        await books.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// A 404 naming which reference failed beats a foreign-key violation surfacing as a 500.
    /// </summary>
    private async Task EnsureReferencesExistAsync(
        Guid authorId,
        Guid genreId,
        CancellationToken cancellationToken)
    {
        if (!await authors.ExistsAsync(authorId, cancellationToken))
        {
            throw new NotFoundException("author", authorId);
        }

        if (await genres.GetByIdAsync(genreId, cancellationToken) is null)
        {
            throw new NotFoundException("genre", genreId);
        }
    }

    private async Task EnsureIsbnIsFreeAsync(
        string? isbn,
        Guid? excludingId,
        CancellationToken cancellationToken)
    {
        if (isbn is null)
        {
            return;
        }

        if (await books.IsbnExistsAsync(isbn, excludingId, cancellationToken))
        {
            throw new DuplicateResourceException(ResourceName, "ISBN", isbn);
        }
    }

    /// <summary>Stores a canonical ISBN so "978-0-441-47812-5" and "9780441478125" collide.</summary>
    private static string? NormalizeIsbn(string? isbn) =>
        string.IsNullOrWhiteSpace(isbn) ? null : Isbn.Normalize(isbn).ToUpperInvariant();

    private static BookResponse ToResponse(Book book) =>
        new(
            book.Id,
            book.Title,
            book.Isbn,
            book.PublicationYear,
            new AuthorSummary(book.Author.Id, book.Author.Name),
            new GenreSummary(book.Genre.Id, book.Genre.Name),
            book.CreatedAt,
            book.UpdatedAt);
}
