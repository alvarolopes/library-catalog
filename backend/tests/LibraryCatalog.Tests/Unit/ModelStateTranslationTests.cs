using FluentValidation;
using LibraryCatalog.Api.Middleware;
using LibraryCatalog.Application.Common;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Shouldly;

namespace LibraryCatalog.Tests.Unit;

/// <summary>
/// The binder's error keys are the awkward part of one-envelope error handling, so
/// the shapes it actually produces are pinned here. Each case below was captured
/// from the running API.
/// </summary>
public class ModelStateTranslationTests
{
    private static readonly string[] ParameterNames = ["request"];

    private static ModelStateDictionary ModelStateWith(params (string Key, string Message)[] errors)
    {
        var modelState = new ModelStateDictionary();

        foreach (var (key, message) in errors)
        {
            modelState.AddModelError(key, message);
        }

        return modelState;
    }

    [Fact]
    public void Valid_model_state_produces_no_exception() =>
        ModelStateTranslation.ToException(new ModelStateDictionary(), ParameterNames).ShouldBeNull();

    [Fact]
    public void A_json_path_becomes_a_pascal_case_property_name()
    {
        var modelState = ModelStateWith(
            ("request", "The request field is required."),
            ("$.publicationYear", "The JSON value could not be converted to LibraryCatalog.Application.Books.CreateBookRequest. Path: $.publicationYear"));

        var exception = ModelStateTranslation.ToException(modelState, ParameterNames)
            .ShouldBeOfType<ValidationException>();

        var failure = exception.Errors.ShouldHaveSingleItem();
        failure.PropertyName.ShouldBe("PublicationYear");
    }

    [Fact]
    public void The_binders_own_wording_never_reaches_the_client()
    {
        var modelState = ModelStateWith(
            ("$.birthDate", "The JSON value could not be converted to LibraryCatalog.Application.Authors.CreateAuthorRequest. Path: $.birthDate | LineNumber: 0 | BytePositionInLine: 35."));

        var exception = ModelStateTranslation.ToException(modelState, ParameterNames)
            .ShouldBeOfType<ValidationException>();

        var message = exception.Errors.ShouldHaveSingleItem().ErrorMessage;
        message.ShouldNotContain("LibraryCatalog");
        message.ShouldNotContain("BytePositionInLine");
    }

    [Fact]
    public void A_query_string_error_keeps_its_own_message()
    {
        // The query binder is already specific and leaks nothing, so it is passed through.
        var modelState = ModelStateWith(("Page", "The value 'abc' is not valid for Page."));

        var exception = ModelStateTranslation.ToException(modelState, ParameterNames)
            .ShouldBeOfType<ValidationException>();

        var failure = exception.Errors.ShouldHaveSingleItem();
        failure.PropertyName.ShouldBe("Page");
        failure.ErrorMessage.ShouldBe("The value 'abc' is not valid for Page.");
    }

    [Fact]
    public void A_body_that_maps_to_nothing_is_malformed_rather_than_invalid()
    {
        // "$" is what the binder reports when the payload cannot become the parameter
        // at all — an array where an object was expected. There is no field to blame.
        var modelState = ModelStateWith(
            ("$", "The JSON value could not be converted to CreateGenreRequest."),
            ("request", "The request field is required."));

        ModelStateTranslation.ToException(modelState, ParameterNames)
            .ShouldBeOfType<MalformedRequestException>();
    }

    [Fact]
    public void The_parameter_entry_alone_is_malformed_rather_than_invalid()
    {
        var modelState = ModelStateWith(("request", "The request field is required."));

        ModelStateTranslation.ToException(modelState, ParameterNames)
            .ShouldBeOfType<MalformedRequestException>();
    }

    [Fact]
    public void Every_offending_field_is_reported_at_once()
    {
        var modelState = ModelStateWith(
            ("$.publicationYear", "bad"),
            ("$.authorId", "bad"),
            ("request", "The request field is required."));

        var exception = ModelStateTranslation.ToException(modelState, ParameterNames)
            .ShouldBeOfType<ValidationException>();

        exception.Errors.Select(e => e.PropertyName)
            .ShouldBe(["PublicationYear", "AuthorId"], ignoreOrder: true);
    }
}
