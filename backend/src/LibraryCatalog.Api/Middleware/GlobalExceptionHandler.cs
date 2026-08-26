using FluentValidation;
using LibraryCatalog.Application.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace LibraryCatalog.Api.Middleware;

/// <summary>
/// The single place where a failure becomes an HTTP response. Every error path —
/// validation, not-found, conflict, unhandled — leaves through here as RFC 9457
/// <c>application/problem+json</c>, which is what makes the responses consistent
/// rather than merely correct.
/// </summary>
public class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problem = exception switch
        {
            ValidationException validation => BuildValidationProblem(validation),
            AppException app => BuildAppProblem(app),
            _ => BuildUnhandledProblem(exception)
        };

        problem.Instance = httpContext.Request.Path;
        problem.Extensions["correlationId"] = CorrelationIdMiddleware.GetCorrelationId(httpContext);

        if (problem.Status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception on {Method} {Path}",
                httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogInformation("Request failed with {Status}: {ProblemType} — {Detail}",
                problem.Status, problem.Type, problem.Detail);
        }

        httpContext.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);

        return true;
    }

    private static ProblemDetails BuildValidationProblem(ValidationException exception)
    {
        // All field errors at once — fixing one at a time is a miserable API to consume.
        var errors = exception.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                group => group.Key,
                group => group.Select(e => e.ErrorMessage).ToArray());

        return new ProblemDetails
        {
            Type = "validation-failed",
            Title = "One or more validation errors occurred.",
            Status = StatusCodes.Status400BadRequest,
            Detail = "The request did not pass validation. See 'errors' for details.",
            Extensions = { ["errors"] = errors }
        };
    }

    private static ProblemDetails BuildAppProblem(AppException exception) => new()
    {
        Type = exception.ProblemType,
        Title = TitleFor(exception.ProblemType),
        Status = (int)exception.StatusCode,
        Detail = exception.Message
    };

    private ProblemDetails BuildUnhandledProblem(Exception exception) => new()
    {
        Type = "internal-server-error",
        Title = "An unexpected error occurred.",
        Status = StatusCodes.Status500InternalServerError,
        // Never leak internals outside Development: a stack trace is a map of the system.
        Detail = environment.IsDevelopment()
            ? exception.ToString()
            : "The request could not be completed. Quote the correlationId when reporting this."
    };

    private static string TitleFor(string problemType) => problemType switch
    {
        "resource-not-found" => "Resource not found.",
        "duplicate-resource" => "Resource already exists.",
        "resource-in-use" => "Resource is still in use.",
        "invalid-credentials" => "Authentication failed.",
        _ => "Request failed."
    };
}
