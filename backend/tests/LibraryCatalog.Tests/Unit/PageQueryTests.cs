using LibraryCatalog.Application.Common;
using Shouldly;

namespace LibraryCatalog.Tests.Unit;

public class PageQueryTests
{
    [Fact]
    public void EffectivePageSize_caps_oversized_requests()
    {
        // A client must not be able to turn a list endpoint into a full table scan.
        new PageQuery { PageSize = 10_000 }.EffectivePageSize.ShouldBe(PageQuery.MaxPageSize);
    }

    [Fact]
    public void EffectivePageSize_floors_nonsensical_requests() =>
        new PageQuery { PageSize = 0 }.EffectivePageSize.ShouldBe(1);

    [Theory]
    [InlineData(1, 20, 0)]
    [InlineData(2, 20, 20)]
    [InlineData(3, 50, 100)]
    public void Skip_is_derived_from_the_effective_page_size(int page, int pageSize, int expected) =>
        new PageQuery { Page = page, PageSize = pageSize }.Skip.ShouldBe(expected);

    [Fact]
    public void Skip_treats_a_zero_or_negative_page_as_the_first_page() =>
        new PageQuery { Page = 0 }.Skip.ShouldBe(0);
}

public class PagedResultTests
{
    [Theory]
    [InlineData(0, 20, 0)]
    [InlineData(1, 20, 1)]
    [InlineData(20, 20, 1)]
    [InlineData(21, 20, 2)] // the partial last page still counts
    [InlineData(137, 20, 7)]
    public void TotalPages_rounds_up(int totalItems, int pageSize, int expected)
    {
        var result = new PagedResult<string>
        {
            Items = [],
            Page = 1,
            PageSize = pageSize,
            TotalItems = totalItems
        };

        result.TotalPages.ShouldBe(expected);
    }
}
