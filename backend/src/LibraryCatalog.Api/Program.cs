using System.Globalization;
using System.Text;
using FluentValidation;
using LibraryCatalog.Api.Middleware;
using LibraryCatalog.Application;
using LibraryCatalog.Infrastructure;
using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Persistence;
using LibraryCatalog.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// An API's output must not vary with the host's locale — otherwise the same
// request answers differently on a developer machine and in production, and
// validation messages arrive in whatever language the server happens to run under.
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.InvariantCulture;
ValidatorOptions.Global.LanguageManager.Enabled = false;

// Structured JSON logs, with the correlation id pushed in per request.
builder.Host.UseSerilog((context, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .Enrich.FromLogContext());

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

builder.Services.AddControllers(options => options.Filters.Add<ValidationFilter>());

// Without this, [ApiController] answers binding failures itself, before any filter
// runs — with a different problem shape and no correlation id. Suppressing it lets
// ValidationFilter translate them so every error leaves through one handler.
builder.Services.Configure<ApiBehaviorOptions>(options =>
    options.SuppressModelStateInvalidFilter = true);

// Without this the document is titled after the assembly ("LibraryCatalog.Api | v1"),
// which is what anyone opening the spec or the Scalar UI sees first.
builder.Services.AddOpenApi(options => options.AddDocumentTransformer((document, _, _) =>
{
    document.Info = new OpenApiInfo
    {
        Title = "Library Catalog API",
        Version = "v1",
        Description = "Search, register and maintain genres, authors and books. "
            + "Reads are public; writes require a bearer token with the staff role."
    };

    return Task.CompletedTask;
}));
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration section is missing.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            // No tolerance for expired tokens beyond the default five-minute drift.
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        // Authentication and authorization short-circuit the pipeline before any
        // exception handler runs, so without these a 401 or 403 answers with an
        // empty body while every other error answers with a problem document.
        options.Events = new JwtBearerEvents
        {
            OnChallenge = context =>
            {
                context.HandleResponse();

                return ProblemResponse.WriteAsync(
                    context.HttpContext,
                    StatusCodes.Status401Unauthorized,
                    "unauthorized",
                    "Authentication is required.",
                    "This endpoint requires a bearer token. Obtain one from POST /api/v1/auth/login.");
            },
            OnForbidden = context => ProblemResponse.WriteAsync(
                context.HttpContext,
                StatusCodes.Status403Forbidden,
                "forbidden",
                "Not allowed.",
                $"This endpoint requires the '{Roles.Staff}' role.")
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Roles.Staff, policy => policy.RequireRole(Roles.Staff));

// Explicit allowlist rather than AllowAnyOrigin: the SPA is the only browser client.
const string SpaCorsPolicy = "spa";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddCors(options => options.AddPolicy(SpaCorsPolicy, policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .WithExposedHeaders(CorrelationIdMiddleware.HeaderName)));

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "database");

var app = builder.Build();

// Migrations and seeding on startup keep `docker compose up` a single command.
// This is deliberate for review and wrong for production — see the README.
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LibraryCatalogDbContext>();
    await db.Database.MigrateAsync();

    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
}

app.UseExceptionHandler();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.MapOpenApi();
app.MapScalarApiReference(options => options.WithTitle("Library Catalog API"));

app.UseCors(SpaCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

await app.RunAsync();

/// <summary>Exposed so the integration tests can boot the real pipeline with WebApplicationFactory.</summary>
public partial class Program;
