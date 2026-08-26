using LibraryCatalog.Application.Common;

namespace LibraryCatalog.Application.Authors;

public record CreateAuthorRequest(string Name, DateOnly? BirthDate, string? Nationality);

public record UpdateAuthorRequest(string Name, DateOnly? BirthDate, string? Nationality);

public record AuthorResponse(
    Guid Id,
    string Name,
    DateOnly? BirthDate,
    string? Nationality,
    DateTime CreatedAt,
    DateTime UpdatedAt);

/// <summary>Minimal shape embedded in a book payload, so the client never needs a second call.</summary>
public record AuthorSummary(Guid Id, string Name);

public class AuthorListQuery : PageQuery;
