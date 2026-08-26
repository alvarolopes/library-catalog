namespace LibraryCatalog.Infrastructure.Entities;

/// <summary>
/// Marks an entity whose timestamps are maintained automatically by
/// <see cref="Persistence.LibraryCatalogDbContext.SaveChangesAsync"/>.
/// </summary>
public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}
