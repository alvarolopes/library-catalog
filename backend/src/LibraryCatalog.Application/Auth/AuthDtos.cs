namespace LibraryCatalog.Application.Auth;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, DateTime ExpiresAt, string Email, string Role);
