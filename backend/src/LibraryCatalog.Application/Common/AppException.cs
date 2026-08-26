using System.Net;

namespace LibraryCatalog.Application.Common;

/// <summary>
/// Base for failures that carry a deliberate HTTP meaning. The API's exception
/// handler translates these into RFC 9457 problem responses; anything that is
/// not an <see cref="AppException"/> becomes a 500 with its detail suppressed.
/// </summary>
public abstract class AppException(string problemType, HttpStatusCode statusCode, string message)
    : Exception(message)
{
    /// <summary>Stable, machine-readable slug used as the problem's <c>type</c>.</summary>
    public string ProblemType { get; } = problemType;

    public HttpStatusCode StatusCode { get; } = statusCode;
}

/// <summary>The requested resource does not exist.</summary>
public class NotFoundException(string resource, Guid id)
    : AppException("resource-not-found", HttpStatusCode.NotFound, $"{resource} '{id}' was not found.");

/// <summary>A uniqueness rule would be violated — duplicate genre name, duplicate ISBN.</summary>
public class DuplicateResourceException(string resource, string field, string value)
    : AppException("duplicate-resource", HttpStatusCode.Conflict,
        $"A {resource} with {field} '{value}' already exists.");

/// <summary>
/// The resource cannot be deleted because other records still depend on it.
/// Deleting an author must not silently delete their books.
/// </summary>
public class ResourceInUseException(string resource, string dependents, int count)
    : AppException("resource-in-use", HttpStatusCode.Conflict,
        $"This {resource} cannot be deleted because {count} {dependents} still reference it.");
