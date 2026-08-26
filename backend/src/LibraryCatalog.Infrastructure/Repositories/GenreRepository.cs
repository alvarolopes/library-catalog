using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LibraryCatalog.Infrastructure.Repositories;

/// <summary>
/// Concrete by design — see the architecture notes in the README. Takes primitives
/// and returns entities so that EF Core and LINQ stay inside this layer.
/// </summary>
public class GenreRepository(LibraryCatalogDbContext db)
{
    /// <summary>Columns a client is allowed to sort by.</summary>
    public static readonly string[] SortableColumns = ["name", "createdAt"];

    public async Task<(IReadOnlyList<Genre> Items, int TotalCount)> ListAsync(
        string? search,
        string? sortBy,
        bool descending,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var query = db.Genres.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(g => EF.Functions.ILike(g.Name, $"%{search}%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = (sortBy?.ToLowerInvariant(), descending) switch
        {
            ("createdat", true) => query.OrderByDescending(g => g.CreatedAt),
            ("createdat", false) => query.OrderBy(g => g.CreatedAt),
            (_, true) => query.OrderByDescending(g => g.Name),
            (_, false) => query.OrderBy(g => g.Name)
        };

        var items = await query.Skip(skip).Take(take).ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Genre?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Genres.FirstOrDefaultAsync(g => g.Id == id, cancellationToken);

    public Task<bool> NameExistsAsync(
        string name,
        Guid? excludingId = null,
        CancellationToken cancellationToken = default) =>
        db.Genres.AnyAsync(g => g.Name == name && (excludingId == null || g.Id != excludingId), cancellationToken);

    public Task<int> CountBooksAsync(Guid genreId, CancellationToken cancellationToken = default) =>
        db.Books.CountAsync(b => b.GenreId == genreId, cancellationToken);

    public void Add(Genre genre) => db.Genres.Add(genre);

    public void Remove(Genre genre) => db.Genres.Remove(genre);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
