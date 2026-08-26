using System.Net;
using System.Net.Http.Json;
using Shouldly;

namespace LibraryCatalog.Tests.Integration;

public sealed class AuthorsEndpointsTests(IntegrationFixture fixture) : ApiTestBase(fixture)
{
    [Fact]
    public async Task Staff_can_create_and_update_an_author()
    {
        using var staff = await CreateStaffClientAsync();
        var name = UniqueValue("Author");
        Guid authorId;

        using (var response = await staff.PostAsJsonAsync("/api/v1/authors", new
        {
            name,
            birthDate = "1970-01-01",
            nationality = "Initial"
        }))
        {
            response.StatusCode.ShouldBe(HttpStatusCode.Created);
            authorId = (await ReadJsonAsync(response)).GetProperty("id").GetGuid();
        }

        using (var response = await staff.PutAsJsonAsync($"/api/v1/authors/{authorId}", new
        {
            name,
            birthDate = "1971-02-03",
            nationality = "Updated"
        }))
        {
            response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
        }

        using var getResponse = await Client.GetAsync($"/api/v1/authors/{authorId}");
        getResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var author = await ReadJsonAsync(getResponse);
        author.GetProperty("birthDate").GetString().ShouldBe("1971-02-03");
        author.GetProperty("nationality").GetString().ShouldBe("Updated");
    }

    [Fact]
    public async Task An_author_referenced_by_books_cannot_be_deleted()
    {
        var authorId = await GetSeedIdAsync("authors", "Ursula K. Le Guin");
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.DeleteAsync($"/api/v1/authors/{authorId}");

        await AssertProblemAsync(response, HttpStatusCode.Conflict, "resource-in-use");

        using var getResponse = await Client.GetAsync($"/api/v1/authors/{authorId}");
        getResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
    }
}
