using Microsoft.AspNetCore.Mvc;

namespace LibraryCatalog.Api.Middleware;

/// <summary>
/// Writes an RFC 9457 problem body for failures that never become exceptions.
///
/// The authentication and authorization middleware short-circuits the pipeline
/// before any handler runs, so without this a 401 or 403 answers with an empty
/// body — a different contract from every other error the API returns.
/// </summary>
public static class ProblemResponse
{
    public static Task WriteAsync(
        HttpContext context,
        int statusCode,
        string problemType,
        string title,
        string detail)
    {
        var problem = new ProblemDetails
        {
            Type = problemType,
            Title = title,
            Status = statusCode,
            Detail = detail,
            Instance = context.Request.Path,
            Extensions = { ["correlationId"] = CorrelationIdMiddleware.GetCorrelationId(context) }
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        return context.Response.WriteAsJsonAsync(problem);
    }
}
