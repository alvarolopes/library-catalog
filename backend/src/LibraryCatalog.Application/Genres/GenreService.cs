using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Repositories;

namespace LibraryCatalog.Application.Genres;

public class GenreService(GenreRepository genres)
{
    private const string ResourceName = "genre";

    public async Task<PagedResult<GenreResponse>> ListAsync(
        GenreListQuery query,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await genres.ListAsync(
            query.Search,
            query.SortBy,
            query.SortDir == SortDirection.Desc,
            query.Skip,
            query.EffectivePageSize,
            cancellationToken);

        return new PagedResult<GenreResponse>
        {
            Items = [.. items.Select(ToResponse)],
            Page = query.Page,
            PageSize = query.EffectivePageSize,
            TotalItems = totalCount
        };
    }

    public async Task<GenreResponse> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var genre = await genres.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        return ToResponse(genre);
    }

    public async Task<GenreResponse> CreateAsync(
        CreateGenreRequest request,
        CancellationToken cancellationToken = default)
    {
        // Checked here for a clean 409; the citext unique index is the backstop
        // that closes the race between this check and the insert.
        if (await genres.NameExistsAsync(request.Name, cancellationToken: cancellationToken))
        {
            throw new DuplicateResourceException(ResourceName, "name", request.Name);
        }

        var genre = new Genre
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim()
        };

        genres.Add(genre);
        await genres.SaveChangesAsync(cancellationToken);

        return ToResponse(genre);
    }

    public async Task UpdateAsync(
        Guid id,
        UpdateGenreRequest request,
        CancellationToken cancellationToken = default)
    {
        var genre = await genres.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        if (await genres.NameExistsAsync(request.Name, id, cancellationToken))
        {
            throw new DuplicateResourceException(ResourceName, "name", request.Name);
        }

        genre.Name = request.Name.Trim();
        genre.Description = request.Description?.Trim();

        await genres.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var genre = await genres.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        // Deleting a genre must not silently delete the books filed under it.
        var bookCount = await genres.CountBooksAsync(id, cancellationToken);

        if (bookCount > 0)
        {
            throw new ResourceInUseException(ResourceName, "books", bookCount);
        }

        genres.Remove(genre);
        await genres.SaveChangesAsync(cancellationToken);
    }

    private static GenreResponse ToResponse(Genre genre) =>
        new(genre.Id, genre.Name, genre.Description, genre.CreatedAt, genre.UpdatedAt);
}
