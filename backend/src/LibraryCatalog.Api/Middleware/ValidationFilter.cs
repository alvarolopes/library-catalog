using FluentValidation;
using Microsoft.AspNetCore.Mvc.Filters;

namespace LibraryCatalog.Api.Middleware;

/// <summary>
/// Runs the FluentValidation validator registered for each action argument, before
/// the action body and before any database access. Throws so that
/// <see cref="GlobalExceptionHandler"/> stays the single place that shapes errors.
/// </summary>
public class ValidationFilter(IServiceProvider services) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        // The automatic [ApiController] model-state response is suppressed so binding
        // failures reach here instead of short-circuiting with a different envelope.
        // They must be raised before the action runs: a body that failed to bind
        // leaves its parameter null.
        var parameterNames = context.ActionDescriptor.Parameters
            .Select(parameter => parameter.Name)
            .ToArray();

        if (ModelStateTranslation.ToException(context.ModelState, parameterNames) is { } bindingFailure)
        {
            throw bindingFailure;
        }

        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
            {
                continue;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());

            if (services.GetService(validatorType) is not IValidator validator)
            {
                continue;
            }

            var validationContext = new ValidationContext<object>(argument);
            var result = await validator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);

            if (!result.IsValid)
            {
                throw new ValidationException(result.Errors);
            }
        }

        await next();
    }
}
