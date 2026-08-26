using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Persistence;
using LibraryCatalog.Infrastructure.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace LibraryCatalog.Tests.Integration;

/// <summary>
/// Boots the real API against the disposable PostgreSQL instance owned by the
/// integration-test collection. The connection string is set before Program
/// builds its services, so startup migrations and seeding target the container.
/// </summary>
public sealed class LibraryCatalogFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Default", connectionString);
        builder.UseSetting("Serilog:MinimumLevel:Default", "Fatal");
        builder.UseSetting("Serilog:MinimumLevel:Override:Microsoft.AspNetCore", "Fatal");
        builder.UseSetting("Serilog:MinimumLevel:Override:Microsoft.EntityFrameworkCore", "Fatal");
        builder.UseSetting("Serilog:MinimumLevel:Override:Microsoft.EntityFrameworkCore.Database.Command", "Fatal");
    }
}

/// <summary>
/// One database and API host for the complete integration collection. Tests only
/// create uniquely named records; seeded records remain read-only fixtures.
/// </summary>
public sealed class IntegrationFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer database = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("librarycatalog")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public LibraryCatalogFactory Factory { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await database.StartAsync();

        Factory = new LibraryCatalogFactory(database.GetConnectionString());
        using var client = Factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        Factory?.Dispose();
        await database.DisposeAsync();
    }

    public async Task EnsureUserAsync(string email, string password, string role)
    {
        await using var scope = Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<LibraryCatalogDbContext>();

        if (await db.Users.AnyAsync(user => user.Email == email))
        {
            return;
        }

        var user = new User { Email = email, Role = role };
        var passwords = scope.ServiceProvider.GetRequiredService<PasswordHashing>();
        user.PasswordHash = passwords.Hash(user, password);

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }
}

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class IntegrationCollection : ICollectionFixture<IntegrationFixture>
{
    public const string Name = "Integration";
}
