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
    public async Task A_genre_can_be_saved_without_renaming_it()
    {
        // The update guard excludes the record's own id. Without that, saving an
        // unchanged name would conflict with itself — a spurious 409 on every edit.
        using var staff = await CreateStaffClientAsync();
        var name = UniqueValue("Genre");
        var genreId = await CreateGenreAsync(staff, name);

        using var response = await staff.PutAsJsonAsync($"/api/v1/genres/{genreId}", new
        {
            name,
            description = "Description changed, name deliberately left alone."
        });

        response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Renaming_a_genre_onto_a_name_already_in_use_conflicts()
    {
        using var staff = await CreateStaffClientAsync();
        var takenName = UniqueValue("Genre");
        await CreateGenreAsync(staff, takenName);
        var genreId = await CreateGenreAsync(staff);

        using var response = await staff.PutAsJsonAsync($"/api/v1/genres/{genreId}", new
        {
            name = takenName,
            description = "Attempting to take a name already in use."
        });

        await AssertProblemAsync(response, HttpStatusCode.Conflict, "duplicate-resource");
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
