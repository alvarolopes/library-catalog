using System.Net;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Repositories;
using LibraryCatalog.Infrastructure.Security;

namespace LibraryCatalog.Application.Auth;

public class AuthService(
    UserRepository users,
    PasswordHashing passwords,
    TokenIssuer tokens)
{
    public async Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await users.GetByEmailAsync(request.Email.Trim(), cancellationToken);

        // Unknown email and wrong password return the same failure on purpose:
        // distinguishing them tells an attacker which accounts exist.
        if (user is null || !passwords.Verify(user, request.Password))
        {
            throw new InvalidCredentialsException();
        }

        var (token, expiresAt) = tokens.Issue(user);

        return new LoginResponse(token, expiresAt, user.Email, user.Role);
    }
}

public class InvalidCredentialsException()
    : AppException("invalid-credentials", HttpStatusCode.Unauthorized, "Email or password is incorrect.");
