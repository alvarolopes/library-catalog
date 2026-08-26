using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace LibraryCatalog.Infrastructure.Persistence;

/// <summary>
/// Seeds a browsable catalog and the single staff account. Idempotent by natural
/// key, so restarting the API does not duplicate rows.
/// </summary>
public class DatabaseSeeder(LibraryCatalogDbContext db, PasswordHashing passwords)
{
    public const string AdminEmail = "admin@librarycatalog.dev";
    public const string AdminPassword = "Admin@123";

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedStaffUserAsync(cancellationToken);
        await SeedCatalogAsync(cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedStaffUserAsync(CancellationToken cancellationToken)
    {
        if (await db.Users.AnyAsync(u => u.Email == AdminEmail, cancellationToken))
        {
            return;
        }

        var admin = new User { Email = AdminEmail, Role = Roles.Staff };
        admin.PasswordHash = passwords.Hash(admin, AdminPassword);

        db.Users.Add(admin);
    }

    private async Task SeedCatalogAsync(CancellationToken cancellationToken)
    {
        if (await db.Genres.AnyAsync(cancellationToken))
        {
            return;
        }

        var scienceFiction = new Genre { Name = "Science Fiction", Description = "Speculative futures and technologies." };
        var fantasy = new Genre { Name = "Fantasy", Description = "Secondary worlds and the impossible made consistent." };
        var literaryFiction = new Genre { Name = "Literary Fiction", Description = "Character-driven work with an emphasis on style." };

        var leGuin = new Author { Name = "Ursula K. Le Guin", BirthDate = new DateOnly(1929, 10, 21), Nationality = "American" };
        var borges = new Author { Name = "Jorge Luis Borges", BirthDate = new DateOnly(1899, 8, 24), Nationality = "Argentine" };
        var pratchett = new Author { Name = "Terry Pratchett", BirthDate = new DateOnly(1948, 4, 28), Nationality = "British" };

        db.Genres.AddRange(scienceFiction, fantasy, literaryFiction);
        db.Authors.AddRange(leGuin, borges, pratchett);

        db.Books.AddRange(
            new Book { Title = "The Left Hand of Darkness", Isbn = "9780441478125", PublicationYear = 1969, Author = leGuin, Genre = scienceFiction },
            new Book { Title = "The Dispossessed", Isbn = "9780060512750", PublicationYear = 1974, Author = leGuin, Genre = scienceFiction },
            new Book { Title = "A Wizard of Earthsea", Isbn = "9780553383041", PublicationYear = 1968, Author = leGuin, Genre = fantasy },
            new Book { Title = "Ficciones", Isbn = "9780802130303", PublicationYear = 1944, Author = borges, Genre = literaryFiction },
            new Book { Title = "The Aleph", Isbn = "9780142437889", PublicationYear = 1949, Author = borges, Genre = literaryFiction },
            new Book { Title = "Guards! Guards!", Isbn = "9780062225758", PublicationYear = 1989, Author = pratchett, Genre = fantasy });
    }
}
