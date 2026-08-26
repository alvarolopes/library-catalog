using LibraryCatalog.Infrastructure.Entities;
using Microsoft.AspNetCore.Identity;

namespace LibraryCatalog.Infrastructure.Security;

/// <summary>
/// Wraps ASP.NET Core's PBKDF2 hasher so callers never touch a raw hash.
/// </summary>
public class PasswordHashing
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password) => _hasher.HashPassword(user, password);

    public bool Verify(User user, string password) =>
        _hasher.VerifyHashedPassword(user, user.PasswordHash, password)
            is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
}
