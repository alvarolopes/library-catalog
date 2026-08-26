using Serilog.Context;

namespace LibraryCatalog.Api.Middleware;

/// <summary>
/// Gives every request an id that appears in the logs, the response header and any
/// problem response, so a user-reported error maps to a log line without guesswork.
/// </summary>
public class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Correlation-Id";
    private const string ItemKey = "CorrelationId";

    public async Task InvokeAsync(HttpContext context)
    {
        // Honour a caller-supplied id so a trace survives across service hops.
        var correlationId = context.Request.Headers[HeaderName].FirstOrDefault()
            is { Length: > 0 } supplied
            ? supplied
            : Guid.CreateVersion7().ToString();

        context.Items[ItemKey] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (LogContext.PushProperty(ItemKey, correlationId))
        {
            await next(context);
        }
    }

    public static string GetCorrelationId(HttpContext context) =>
        context.Items.TryGetValue(ItemKey, out var value) && value is string id
            ? id
            : string.Empty;
}
