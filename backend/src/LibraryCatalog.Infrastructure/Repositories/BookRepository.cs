using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LibraryCatalog.Infrastructure.Repositories;

public class BookRepository(LibraryCatalogDbContext db)
{
    /// <summary>Columns a client is allowed to sort by.</summary>
    public static readonly string[] SortableColumns = ["title", "publicationYear", "createdAt"];

    public async Task<(IReadOnlyList<Book> Items, int TotalCount)> ListAsync(
        string? search,
        Guid? authorId,
        Guid? genreId,
        string? sortBy,
        bool descending,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        // Author and genre are always resolved: a book list without them is useless,
        // and one join beats a second round trip per row.
        var query = db.Books
            .AsNoTracking()
            .Include(b => b.Author)
            .Include(b => b.Genre)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(b =>
                EF.Functions.ILike(b.Title, $"%{search}%") ||
                (b.Isbn != null && EF.Functions.ILike(b.Isbn, $"%{search}%")));
        }

        if (authorId is not null)
        {
            query = query.Where(b => b.AuthorId == authorId);
        }

        if (genreId is not null)
        {
            query = query.Where(b => b.GenreId == genreId);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = (sortBy?.ToLowerInvariant(), descending) switch
        {
            ("publicationyear", true) => query.OrderByDescending(b => b.PublicationYear),
            ("publicationyear", false) => query.OrderBy(b => b.PublicationYear),
            ("createdat", true) => query.OrderByDescending(b => b.CreatedAt),
            ("createdat", false) => query.OrderBy(b => b.CreatedAt),
            (_, true) => query.OrderByDescending(b => b.Title),
            (_, false) => query.OrderBy(b => b.Title)
        };

        var items = await query.Skip(skip).Take(take).ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Book?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Books
            .Include(b => b.Author)
            .Include(b => b.Genre)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public Task<bool> IsbnExistsAsync(
        string isbn,
        Guid? excludingId = null,
        CancellationToken cancellationToken = default) =>
        db.Books.AnyAsync(b => b.Isbn == isbn && (excludingId == null || b.Id != excludingId), cancellationToken);

    public void Add(Book book) => db.Books.Add(book);

    public void Remove(Book book) => db.Books.Remove(book);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
