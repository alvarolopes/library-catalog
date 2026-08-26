namespace LibraryCatalog.Application.Common;

/// <summary>
/// Shared list parameters. <see cref="PageSize"/> is capped so a client cannot
/// turn a list endpoint into a full table scan.
/// </summary>
public class PageQuery
{
    public const int MaxPageSize = 100;
    public const int DefaultPageSize = 20;

    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = DefaultPageSize;

    /// <summary>Free-text filter; the meaning of "matches" is per-resource.</summary>
    public string? Search { get; init; }

    /// <summary>Column to sort by. Validated against a per-resource allowlist.</summary>
    public string? SortBy { get; init; }

    public SortDirection SortDir { get; init; } = SortDirection.Asc;

    public int Skip => (Math.Max(Page, 1) - 1) * EffectivePageSize;
    public int EffectivePageSize => Math.Clamp(PageSize, 1, MaxPageSize);
}

public enum SortDirection
{
    Asc,
    Desc
}
