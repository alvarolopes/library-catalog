using LibraryCatalog.Application.Common;
using Shouldly;

namespace LibraryCatalog.Tests.Unit;

/// <summary>
/// A malformed ISBN is not a formatting nit — it is a wrong identifier that would
/// silently point at another book, so the checksum is worth testing directly.
/// </summary>
public class IsbnTests
{
    [Theory]
    [InlineData("9780441478125")] // The Left Hand of Darkness
    [InlineData("978-0-441-47812-5")] // same value, hyphenated
    [InlineData("0441478123")] // ISBN-10
    [InlineData("043942089X")] // ISBN-10 whose check digit is X, meaning 10
    public void IsValid_accepts_well_formed_isbns(string value) =>
        Isbn.IsValid(value).ShouldBeTrue();

    [Theory]
    [InlineData("9780441478126")] // ISBN-13 with a wrong check digit
    [InlineData("0441478124")] // ISBN-10 with a wrong check digit
    [InlineData("123")] // too short
    [InlineData("97804414781234")] // too long
    [InlineData("978044147812X")] // X is only legal as an ISBN-10 check digit
    [InlineData("")]
    [InlineData(null)]
    public void IsValid_rejects_malformed_isbns(string? value) =>
        Isbn.IsValid(value).ShouldBeFalse();

    [Fact]
    public void Normalize_strips_separators_so_equivalent_isbns_collide() =>
        Isbn.Normalize("978-0-441-47812-5").ShouldBe("9780441478125");
}
