using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LibraryCatalog.Infrastructure.Repositories;

public class AuthorRepository(LibraryCatalogDbContext db)
{
    /// <summary>Columns a client is allowed to sort by.</summary>
    public static readonly string[] SortableColumns = ["name", "birthDate", "createdAt"];

    public async Task<(IReadOnlyList<Author> Items, int TotalCount)> ListAsync(
        string? search,
        string? sortBy,
        bool descending,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var query = db.Authors.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a => EF.Functions.ILike(a.Name, $"%{search}%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = (sortBy?.ToLowerInvariant(), descending) switch
        {
            ("birthdate", true) => query.OrderByDescending(a => a.BirthDate),
            ("birthdate", false) => query.OrderBy(a => a.BirthDate),
            ("createdat", true) => query.OrderByDescending(a => a.CreatedAt),
            ("createdat", false) => query.OrderBy(a => a.CreatedAt),
            (_, true) => query.OrderByDescending(a => a.Name),
            (_, false) => query.OrderBy(a => a.Name)
        };

        var items = await query.Skip(skip).Take(take).ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<Author?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Authors.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Authors.AnyAsync(a => a.Id == id, cancellationToken);

    public Task<int> CountBooksAsync(Guid authorId, CancellationToken cancellationToken = default) =>
        db.Books.CountAsync(b => b.AuthorId == authorId, cancellationToken);

    public void Add(Author author) => db.Authors.Add(author);

    public void Remove(Author author) => db.Authors.Remove(author);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
