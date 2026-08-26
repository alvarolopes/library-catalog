using FluentValidation;
using LibraryCatalog.Application.Auth;
using LibraryCatalog.Application.Authors;
using LibraryCatalog.Application.Books;
using LibraryCatalog.Application.Genres;
using Microsoft.Extensions.DependencyInjection;

namespace LibraryCatalog.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<GenreService>();
        services.AddScoped<AuthorService>();
        services.AddScoped<BookService>();
        services.AddScoped<AuthService>();

        services.AddValidatorsFromAssemblyContaining<GenreService>(includeInternalTypes: true);

        return services;
    }
}
