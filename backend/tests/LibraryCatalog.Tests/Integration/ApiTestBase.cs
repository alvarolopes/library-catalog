using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LibraryCatalog.Infrastructure.Persistence;
using Shouldly;

namespace LibraryCatalog.Tests.Integration;

[Collection(IntegrationCollection.Name)]
public abstract class ApiTestBase
{
    private const string ReaderEmail = "reader@integration.test";
    private const string ReaderPassword = "Reader@123";
    private static int isbnSequence;

    protected ApiTestBase(IntegrationFixture fixture)
    {
        Fixture = fixture;
        Client = fixture.Factory.CreateClient();
    }

    protected IntegrationFixture Fixture { get; }
    protected HttpClient Client { get; }

    protected async Task<HttpClient> CreateStaffClientAsync() =>
        await CreateAuthenticatedClientAsync(DatabaseSeeder.AdminEmail, DatabaseSeeder.AdminPassword);

    protected async Task<HttpClient> CreateReaderClientAsync()
    {
        await Fixture.EnsureUserAsync(ReaderEmail, ReaderPassword, "reader");
        return await CreateAuthenticatedClientAsync(ReaderEmail, ReaderPassword);
    }

    protected async Task<Guid> CreateGenreAsync(HttpClient client, string? name = null)
    {
        using var response = await client.PostAsJsonAsync("/api/v1/genres", new
        {
            name = name ?? UniqueValue("Genre"),
            description = "Created by the integration suite."
        });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await ReadJsonAsync(response)).GetProperty("id").GetGuid();
    }

    protected async Task<Guid> CreateAuthorAsync(HttpClient client, string? name = null)
    {
        using var response = await client.PostAsJsonAsync("/api/v1/authors", new
        {
            name = name ?? UniqueValue("Author"),
            birthDate = "1970-01-01",
            nationality = "Test"
        });

        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        return (await ReadJsonAsync(response)).GetProperty("id").GetGuid();
    }

    protected async Task<Guid> GetSeedIdAsync(string resource, string name)
    {
        using var response = await Client.GetAsync(
            $"/api/v1/{resource}?search={Uri.EscapeDataString(name)}&pageSize=100");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var items = (await ReadJsonAsync(response)).GetProperty("items");
        return items
            .EnumerateArray()
            .Single(item => item.GetProperty("name").GetString() == name)
            .GetProperty("id")
            .GetGuid();
    }

    protected static string UniqueValue(string prefix) => $"{prefix} {Guid.NewGuid():N}";

    protected static string NewIsbn()
    {
        var body = $"978{Interlocked.Increment(ref isbnSequence):D9}";
        var weightedSum = body
            .Select((digit, index) => (digit - '0') * (index % 2 == 0 ? 1 : 3))
            .Sum();

        return $"{body}{(10 - weightedSum % 10) % 10}";
    }

    protected static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(content);
        return document.RootElement.Clone();
    }

    protected static async Task<JsonElement> AssertProblemAsync(
        HttpResponseMessage response,
        HttpStatusCode expectedStatus,
        string expectedType,
        params string[] expectedFields)
    {
        response.StatusCode.ShouldBe(expectedStatus);

        var problem = await ReadJsonAsync(response);
        problem.GetProperty("type").GetString().ShouldBe(expectedType);

        var correlationId = problem.GetProperty("correlationId").GetString();
        (correlationId?.Length > 0).ShouldBeTrue();

        if (expectedFields.Length > 0)
        {
            var errors = problem.GetProperty("errors");

            foreach (var field in expectedFields)
            {
                errors.TryGetProperty(field, out _).ShouldBeTrue();
            }
        }

        return problem;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string email, string password)
    {
        using var response = await Client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        response.StatusCode.ShouldBe(HttpStatusCode.OK);

        var token = (await ReadJsonAsync(response)).GetProperty("token").GetString();
        (token?.Length > 0).ShouldBeTrue();

        var client = Fixture.Factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
