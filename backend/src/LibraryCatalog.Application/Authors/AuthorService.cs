using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Repositories;

namespace LibraryCatalog.Application.Authors;

public class AuthorService(AuthorRepository authors)
{
    private const string ResourceName = "author";

    public async Task<PagedResult<AuthorResponse>> ListAsync(
        AuthorListQuery query,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await authors.ListAsync(
            query.Search,
            query.SortBy,
            query.SortDir == SortDirection.Desc,
            query.Skip,
            query.EffectivePageSize,
            cancellationToken);

        return new PagedResult<AuthorResponse>
        {
            Items = [.. items.Select(ToResponse)],
            Page = query.Page,
            PageSize = query.EffectivePageSize,
            TotalItems = totalCount
        };
    }

    public async Task<AuthorResponse> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var author = await authors.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        return ToResponse(author);
    }

    public async Task<AuthorResponse> CreateAsync(
        CreateAuthorRequest request,
        CancellationToken cancellationToken = default)
    {
        // Author names are deliberately not unique: homonyms are real, and
        // collapsing two people into one record is worse than allowing a duplicate.
        var author = new Author
        {
            Name = request.Name.Trim(),
            BirthDate = request.BirthDate,
            Nationality = request.Nationality?.Trim()
        };

        authors.Add(author);
        await authors.SaveChangesAsync(cancellationToken);

        return ToResponse(author);
    }

    public async Task UpdateAsync(
        Guid id,
        UpdateAuthorRequest request,
        CancellationToken cancellationToken = default)
    {
        var author = await authors.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        author.Name = request.Name.Trim();
        author.BirthDate = request.BirthDate;
        author.Nationality = request.Nationality?.Trim();

        await authors.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var author = await authors.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException(ResourceName, id);

        // Deleting an author must not silently delete their catalog.
        var bookCount = await authors.CountBooksAsync(id, cancellationToken);

        if (bookCount > 0)
        {
            throw new ResourceInUseException(ResourceName, "books", bookCount);
        }

        authors.Remove(author);
        await authors.SaveChangesAsync(cancellationToken);
    }

    private static AuthorResponse ToResponse(Author author) =>
        new(author.Id, author.Name, author.BirthDate, author.Nationality, author.CreatedAt, author.UpdatedAt);
}
