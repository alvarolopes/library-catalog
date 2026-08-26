using FluentValidation;
using FluentValidation.Results;
using LibraryCatalog.Application.Common;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace LibraryCatalog.Api.Middleware;

/// <summary>
/// Turns model-binding failures into the same exceptions the rest of the API throws,
/// so every error still leaves through <see cref="GlobalExceptionHandler"/>.
///
/// Binding fails before any validator runs, which is why these have to be picked up
/// separately rather than reported by FluentValidation.
/// </summary>
public static class ModelStateTranslation
{
    /// <summary>
    /// The JSON binder attributes errors to a path like <c>$.publicationYear</c>;
    /// the query-string binder uses the property name directly.
    /// </summary>
    private const string JsonPathPrefix = "$.";

    /// <summary>
    /// The binder's own wording names internal types and byte offsets, which is not
    /// something to hand a client. The original stays in the log, reachable through
    /// the correlation id.
    /// </summary>
    private const string InvalidValueMessage = "The value provided is not valid for this field.";

    /// <summary>
    /// Builds the exception describing <paramref name="modelState"/>, or null when it
    /// is valid. <paramref name="parameterNames"/> are the action's own parameters —
    /// the binder adds an entry for the whole parameter ("The request field is
    /// required.") alongside the real cause, and reporting that would just be noise.
    /// </summary>
    public static Exception? ToException(
        ModelStateDictionary modelState,
        IReadOnlyCollection<string> parameterNames)
    {
        if (modelState.IsValid)
        {
            return null;
        }

        var failures = new List<ValidationFailure>();

        foreach (var (key, entry) in modelState)
        {
            // A bare "$" means the body could not be mapped to the parameter at all,
            // so there is no field to blame.
            if (key == "$" || parameterNames.Contains(key))
            {
                continue;
            }

            var isJsonPath = key.StartsWith(JsonPathPrefix, StringComparison.Ordinal);
            var propertyName = isJsonPath ? ToPropertyName(key[JsonPathPrefix.Length..]) : key;

            foreach (var error in entry.Errors)
            {
                // Query-string binder messages are already safe and specific; only the
                // JSON binder's leak internals.
                var message = isJsonPath || string.IsNullOrWhiteSpace(error.ErrorMessage)
                    ? InvalidValueMessage
                    : error.ErrorMessage;

                failures.Add(new ValidationFailure(propertyName, message));
            }
        }

        return failures.Count > 0
            ? new ValidationException(failures)
            : new MalformedRequestException();
    }

    /// <summary>
    /// Matches FluentValidation's PascalCase property names so a client sees one shape
    /// regardless of which layer rejected the request.
    /// </summary>
    private static string ToPropertyName(string jsonPath) =>
        string.Join('.', jsonPath.Split('.').Select(Capitalize));

    private static string Capitalize(string segment) =>
        segment.Length == 0 ? segment : char.ToUpperInvariant(segment[0]) + segment[1..];
}
