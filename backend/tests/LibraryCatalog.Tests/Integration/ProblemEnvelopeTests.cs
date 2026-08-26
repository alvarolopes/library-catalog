using System.Net;
using System.Net.Http.Json;
using System.Text;
using Shouldly;

namespace LibraryCatalog.Tests.Integration;

/// <summary>
/// The API's promise is that every failure leaves through one envelope: a stable
/// <c>type</c> slug and a correlation id, with no internals.
///
/// Model binding and the authentication middleware both short-circuit before the
/// exception handler and each used to answer with a shape of their own, so those
/// paths are pinned here rather than trusted.
/// </summary>
public sealed class ProblemEnvelopeTests(IntegrationFixture fixture) : ApiTestBase(fixture)
{
    private static StringContent Json(string body) =>
        new(body, Encoding.UTF8, "application/json");

    [Fact]
    public async Task A_field_of_the_wrong_type_is_reported_like_any_other_validation_error()
    {
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.PostAsync("/api/v1/books", Json(
            """{"title":"Binding","isbn":null,"publicationYear":"not-a-year","authorId":"6c8f1f16-0a1f-4d2f-9b2b-2f0a0f1d8f11","genreId":"6c8f1f16-0a1f-4d2f-9b2b-2f0a0f1d8f12"}"""));

        // Keyed by the property name a validator would use, not the binder's
        // "$.publicationYear", so a client can attach it to the right field.
        await AssertProblemAsync(
            response,
            HttpStatusCode.BadRequest,
            "validation-failed",
            "PublicationYear");
    }

    [Fact]
    public async Task An_empty_string_for_a_date_is_a_field_error_not_a_binder_dump()
    {
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.PostAsync("/api/v1/authors", Json(
            """{"name":"Binding probe","birthDate":"","nationality":null}"""));

        await AssertProblemAsync(response, HttpStatusCode.BadRequest, "validation-failed", "BirthDate");
    }

    [Fact]
    public async Task A_body_that_maps_to_no_field_is_malformed_rather_than_invalid()
    {
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.PostAsync("/api/v1/genres", Json("[1,2,3]"));

        var problem = await AssertProblemAsync(
            response,
            HttpStatusCode.BadRequest,
            "malformed-request");

        // There is no field to blame, so inventing one would be worse than useless.
        problem.TryGetProperty("errors", out _).ShouldBeFalse();
    }

    [Fact]
    public async Task An_unbindable_query_parameter_is_reported_against_that_parameter()
    {
        using var response = await Client.GetAsync("/api/v1/genres?page=abc");

        await AssertProblemAsync(response, HttpStatusCode.BadRequest, "validation-failed", "Page");
    }

    [Theory]
    [InlineData("/api/v1/books", """{"title":"X","isbn":null,"publicationYear":"abc","authorId":"6c8f1f16-0a1f-4d2f-9b2b-2f0a0f1d8f11","genreId":"6c8f1f16-0a1f-4d2f-9b2b-2f0a0f1d8f12"}""")]
    [InlineData("/api/v1/genres", """{"name":{"nested":1}}""")]
    [InlineData("/api/v1/genres", "[1,2,3]")]
    public async Task No_failure_leaks_internals_to_the_client(string path, string body)
    {
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.PostAsync(path, Json(body));

        var payload = await response.Content.ReadAsStringAsync();

        // The binder's own wording names the request type, the byte offset and the
        // line number. None of that is a client's business.
        payload.ShouldNotContain("LibraryCatalog.");
        payload.ShouldNotContain("BytePositionInLine");
        payload.ShouldNotContain("tools.ietf.org");
    }
}
