using LibraryCatalog.Application.Common;

namespace LibraryCatalog.Application.Genres;

public record CreateGenreRequest(string Name, string? Description);

public record UpdateGenreRequest(string Name, string? Description);

public record GenreResponse(
    Guid Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>Minimal shape embedded in a book payload, so the client never needs a second call.</summary>
public record GenreSummary(Guid Id, string Name);

public class GenreListQuery : PageQuery;
