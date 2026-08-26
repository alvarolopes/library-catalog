using FluentValidation;

namespace LibraryCatalog.Application.Common;

/// <summary>
/// Shared list-parameter rules, generic so each resource's list query can
/// <c>Include</c> them. <paramref name="sortableColumns"/> is an allowlist:
/// rejecting an unknown column with a 400 is clearer than silently falling back
/// to a default sort, and it keeps arbitrary expressions away from the query.
/// </summary>
public class PageQueryValidator<T> : AbstractValidator<T> where T : PageQuery
{
    public PageQueryValidator(string[] sortableColumns)
    {
        RuleFor(q => q.Page)
            .GreaterThanOrEqualTo(1);

        RuleFor(q => q.PageSize)
            .InclusiveBetween(1, PageQuery.MaxPageSize);

        RuleFor(q => q.Search)
            .MaximumLength(200);

        RuleFor(q => q.SortBy)
            .Must(sortBy => sortBy is null ||
                sortableColumns.Contains(sortBy, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"Must be one of: {string.Join(", ", sortableColumns)}.");
    }
}
