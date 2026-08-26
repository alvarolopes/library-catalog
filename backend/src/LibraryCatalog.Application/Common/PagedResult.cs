namespace LibraryCatalog.Application.Common;

/// <summary>
/// List responses are envelopes, not bare arrays, so a client can page without
/// a second call to discover how much is left.
/// </summary>
public class PagedResult<T>
{
    public required IReadOnlyList<T> Items { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
    public required int TotalItems { get; init; }

    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);
}
