using System.Net;
using System.Net.Http.Json;
using Shouldly;

namespace LibraryCatalog.Tests.Integration;

public sealed class BooksEndpointsTests(IntegrationFixture fixture) : ApiTestBase(fixture)
{
    [Fact]
    public async Task A_book_round_trips_with_its_resolved_author_and_genre()
    {
        using var staff = await CreateStaffClientAsync();
        var authorId = await CreateAuthorAsync(staff);
        var genreId = await CreateGenreAsync(staff);
        var title = UniqueValue("Book");
        var isbn = NewIsbn();
        Guid bookId;

        using (var response = await staff.PostAsJsonAsync("/api/v1/books", new
        {
            title,
            isbn,
            publicationYear = 2001,
            authorId,
            genreId
        }))
        {
            response.StatusCode.ShouldBe(HttpStatusCode.Created);
            var created = await ReadJsonAsync(response);
            bookId = created.GetProperty("id").GetGuid();
            created.GetProperty("author").GetProperty("id").GetGuid().ShouldBe(authorId);
            created.GetProperty("genre").GetProperty("id").GetGuid().ShouldBe(genreId);
        }

        using var getResponse = await Client.GetAsync($"/api/v1/books/{bookId}");
        getResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var book = await ReadJsonAsync(getResponse);
        book.GetProperty("title").GetString().ShouldBe(title);
        book.GetProperty("isbn").GetString().ShouldBe(isbn);
        book.GetProperty("author").GetProperty("id").GetGuid().ShouldBe(authorId);
        book.GetProperty("genre").GetProperty("id").GetGuid().ShouldBe(genreId);
    }

    [Fact]
    public async Task Duplicate_isbns_are_rejected()
    {
        using var staff = await CreateStaffClientAsync();
        var authorId = await CreateAuthorAsync(staff);
        var genreId = await CreateGenreAsync(staff);
        var isbn = NewIsbn();

        using (var response = await staff.PostAsJsonAsync("/api/v1/books", new
        {
            title = UniqueValue("First book"),
            isbn,
            publicationYear = 2001,
            authorId,
            genreId
        }))
        {
            response.StatusCode.ShouldBe(HttpStatusCode.Created);
        }

        using var duplicateResponse = await staff.PostAsJsonAsync("/api/v1/books", new
        {
            title = UniqueValue("Second book"),
            isbn,
            publicationYear = 2002,
            authorId,
            genreId
        });

        await AssertProblemAsync(duplicateResponse, HttpStatusCode.Conflict, "duplicate-resource");
    }

    [Fact]
    public async Task A_book_with_an_unknown_author_returns_a_not_found_problem()
    {
        using var staff = await CreateStaffClientAsync();
        var genreId = await CreateGenreAsync(staff);

        using var response = await staff.PostAsJsonAsync("/api/v1/books", new
        {
            title = UniqueValue("Book"),
            isbn = NewIsbn(),
            publicationYear = 2001,
            authorId = Guid.NewGuid(),
            genreId
        });

        var problem = await AssertProblemAsync(response, HttpStatusCode.NotFound, "resource-not-found");
        var detail = problem.GetProperty("detail").GetString() ?? string.Empty;
        detail.ShouldContain("author");
    }

    [Fact]
    public async Task Invalid_book_fields_are_reported_together()
    {
        using var staff = await CreateStaffClientAsync();
        using var response = await staff.PostAsJsonAsync("/api/v1/books", new
        {
            title = "Validation check",
            isbn = "9780306406158",
            publicationYear = 1449,
            authorId = Guid.NewGuid(),
            genreId = Guid.NewGuid()
        });

        await AssertProblemAsync(
            response,
            HttpStatusCode.BadRequest,
            "validation-failed",
            "Isbn",
            "PublicationYear");
    }

    [Fact]
    public async Task Books_list_filters_case_insensitively_and_returns_correct_paging_metadata()
    {
        // Built rather than borrowed from the seeder: asserting literal seed counts
        // means a new seeded book fails this test with a message about paging, and
        // any future test that attaches a book to a seeded author breaks it from a
        // file it never touched.
        using var staff = await CreateStaffClientAsync();
        var authorId = await CreateAuthorAsync(staff);
        var genreId = await CreateGenreAsync(staff);
        var otherGenreId = await CreateGenreAsync(staff);
        var marker = Guid.NewGuid().ToString("N");

        // Three books for the author, two of them in the same genre.
        foreach (var genre in new[] { genreId, genreId, otherGenreId })
        {
            using var created = await staff.PostAsJsonAsync("/api/v1/books", new
            {
                title = $"Paging {marker} {Guid.NewGuid():N}",
                isbn = NewIsbn(),
                publicationYear = 2001,
                authorId,
                genreId = genre
            });

            created.StatusCode.ShouldBe(HttpStatusCode.Created);
        }

        using (var response = await Client.GetAsync($"/api/v1/books?authorId={authorId}&pageSize=2"))
        {
            response.StatusCode.ShouldBe(HttpStatusCode.OK);
            var page = await ReadJsonAsync(response);
            page.GetProperty("page").GetInt32().ShouldBe(1);
            page.GetProperty("pageSize").GetInt32().ShouldBe(2);
            page.GetProperty("totalItems").GetInt32().ShouldBe(3);
            // The partial last page still counts.
            page.GetProperty("totalPages").GetInt32().ShouldBe(2);
            page.GetProperty("items").GetArrayLength().ShouldBe(2);

            foreach (var book in page.GetProperty("items").EnumerateArray())
            {
                book.GetProperty("author").GetProperty("id").GetGuid().ShouldBe(authorId);
            }
        }

        using (var response = await Client.GetAsync($"/api/v1/books?genreId={genreId}"))
        {
            response.StatusCode.ShouldBe(HttpStatusCode.OK);
            var page = await ReadJsonAsync(response);
            page.GetProperty("totalItems").GetInt32().ShouldBe(2);
            page.GetProperty("totalPages").GetInt32().ShouldBe(1);
        }

        // Search is case-insensitive: the titles above are capitalised, the query is not.
        using var searchResponse = await Client.GetAsync($"/api/v1/books?search=paging%20{marker}");
        searchResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
        var searchPage = await ReadJsonAsync(searchResponse);
        searchPage.GetProperty("totalItems").GetInt32().ShouldBe(3);
    }

    [Fact]
    public async Task Invalid_list_parameters_return_field_errors()
    {
        using (var response = await Client.GetAsync("/api/v1/books?pageSize=101"))
        {
            await AssertProblemAsync(response, HttpStatusCode.BadRequest, "validation-failed", "PageSize");
        }

        using var sortResponse = await Client.GetAsync("/api/v1/books?sortBy=author");
        await AssertProblemAsync(sortResponse, HttpStatusCode.BadRequest, "validation-failed", "SortBy");
    }
}
