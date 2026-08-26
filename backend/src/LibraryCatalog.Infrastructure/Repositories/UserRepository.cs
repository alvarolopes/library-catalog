using LibraryCatalog.Infrastructure.Entities;
using LibraryCatalog.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LibraryCatalog.Infrastructure.Repositories;

public class UserRepository(LibraryCatalogDbContext db)
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
}
