using System.Net;
using System.Net.Http.Json;
using LibraryCatalog.Infrastructure.Persistence;
using Shouldly;

namespace LibraryCatalog.Tests.Integration;

public sealed class AuthEndpointsTests(IntegrationFixture fixture) : ApiTestBase(fixture)
{
    [Fact]
    public async Task Login_with_seeded_staff_credentials_returns_a_staff_token()
    {
        using var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = DatabaseSeeder.AdminEmail,
            password = DatabaseSeeder.AdminPassword
        });

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var login = await ReadJsonAsync(response);

        (login.GetProperty("token").GetString()?.Length > 0).ShouldBeTrue();
        login.GetProperty("email").GetString().ShouldBe(DatabaseSeeder.AdminEmail);
        login.GetProperty("role").GetString().ShouldBe("staff");
    }

    [Fact]
    public async Task Login_with_invalid_credentials_returns_a_correlated_problem()
    {
        using var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = DatabaseSeeder.AdminEmail,
            password = "not-the-password"
        });

        await AssertProblemAsync(response, HttpStatusCode.Unauthorized, "invalid-credentials");
    }

    [Fact]
    public async Task Catalog_reads_are_public()
    {
        var genreId = await GetSeedIdAsync("genres", "Fantasy");
        var authorId = await GetSeedIdAsync("authors", "Ursula K. Le Guin");

        using var books = await Client.GetAsync("/api/v1/books");
        books.StatusCode.ShouldBe(HttpStatusCode.OK);
        var bookId = (await ReadJsonAsync(books)).GetProperty("items")[0].GetProperty("id").GetGuid();

        foreach (var path in new[]
                 {
                     "/api/v1/genres",
                     $"/api/v1/genres/{genreId}",
                     "/api/v1/authors",
                     $"/api/v1/authors/{authorId}",
                     "/api/v1/books",
                     $"/api/v1/books/{bookId}"
                 })
        {
            using var response = await Client.GetAsync(path);
            response.StatusCode.ShouldBe(HttpStatusCode.OK);
        }
    }

    [Fact]
    public async Task Every_write_endpoint_requires_the_staff_role()
    {
        using var reader = await CreateReaderClientAsync();

        // Asserted through the problem envelope rather than the status code alone.
        // Authentication and authorization short-circuit the pipeline before any
        // exception handler, and used to answer with an empty body — a status-only
        // assertion would not have noticed, and would not notice a regression.
        foreach (var request in CreateWriteRequests())
        {
            using (request)
            using (var response = await Client.SendAsync(request))
            {
                await AssertProblemAsync(response, HttpStatusCode.Unauthorized, "unauthorized");
            }
        }

        foreach (var request in CreateWriteRequests())
        {
            using (request)
            using (var response = await reader.SendAsync(request))
            {
                await AssertProblemAsync(response, HttpStatusCode.Forbidden, "forbidden");
            }
        }

        using var staff = await CreateStaffClientAsync();
        var genreId = await CreateGenreAsync(staff);
        genreId.ShouldNotBe(Guid.Empty);
    }

    private static IEnumerable<HttpRequestMessage> CreateWriteRequests()
    {
        var id = Guid.NewGuid();
        var book = new
        {
            title = "Authorization check",
            isbn = "9780306406157",
            publicationYear = 1980,
            authorId = Guid.NewGuid(),
            genreId = Guid.NewGuid()
        };

        yield return JsonRequest(HttpMethod.Post, "/api/v1/genres", new { name = "Authorization genre" });
        yield return JsonRequest(HttpMethod.Put, $"/api/v1/genres/{id}", new { name = "Authorization genre" });
        yield return new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/genres/{id}");

        yield return JsonRequest(HttpMethod.Post, "/api/v1/authors", new { name = "Authorization author" });
        yield return JsonRequest(HttpMethod.Put, $"/api/v1/authors/{id}", new { name = "Authorization author" });
        yield return new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/authors/{id}");

        yield return JsonRequest(HttpMethod.Post, "/api/v1/books", book);
        yield return JsonRequest(HttpMethod.Put, $"/api/v1/books/{id}", book);
        yield return new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/books/{id}");
    }

    private static HttpRequestMessage JsonRequest(HttpMethod method, string path, object body) =>
        new(method, path) { Content = JsonContent.Create(body) };
}
