using LibraryCatalog.Infrastructure.Persistence;
using LibraryCatalog.Infrastructure.Repositories;
using LibraryCatalog.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LibraryCatalog.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");

        services.AddDbContext<LibraryCatalogDbContext>(options => options
            .UseNpgsql(connectionString)
            .UseSnakeCaseNamingConvention());

        services.AddScoped<GenreRepository>();
        services.AddScoped<AuthorRepository>();
        services.AddScoped<BookRepository>();
        services.AddScoped<UserRepository>();

        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<PasswordHashing>();
        services.AddSingleton<TokenIssuer>();
        services.AddScoped<DatabaseSeeder>();

        return services;
    }
}
