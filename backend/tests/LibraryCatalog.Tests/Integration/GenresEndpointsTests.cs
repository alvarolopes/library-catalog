using System.Net;
using System.Net.Http.Json;
using Shouldly;

namespace LibraryCatalog.Tests.Integration;

public sealed class GenresEndpointsTests(IntegrationFixture fixture) : ApiTestBase(fixture)
{
    [Fact]
    public async Task Genre_names_are_unique_without_regard_to_case()
    {
        using var staff = await CreateStaffClientAsync();
        var name = UniqueValue("Genre");
        await CreateGenreAsync(staff, name);

        using var response = await staff.PostAsJsonAsync("/api/v1/genres", new
        {
            name = name.ToLowerInvariant(),
            description = "Duplicate by case."
        });

        await AssertProblemAsync(response, HttpStatusCode.Conflict, "duplicate-resource");
    }

    [Fact]
    public async Task Genre_validation_reports_the_invalid_field()
    {
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.PostAsJsonAsync("/api/v1/genres", new
        {
            name = "X",
            description = (string?)null
        });

        await AssertProblemAsync(response, HttpStatusCode.BadRequest, "validation-failed", "Name");
    }

    [Fact]
    public async Task A_genre_referenced_by_books_cannot_be_deleted()
    {
        var genreId = await GetSeedIdAsync("genres", "Fantasy");
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.DeleteAsync($"/api/v1/genres/{genreId}");

        await AssertProblemAsync(response, HttpStatusCode.Conflict, "resource-in-use");

        using var getResponse = await Client.GetAsync($"/api/v1/genres/{genreId}");
        getResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
