namespace LibraryCatalog.Infrastructure.Security;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "library-catalog";
    public string Audience { get; set; } = "library-catalog";

    /// <summary>
    /// HS256 signing key. Read from configuration here, which is a known
    /// limitation — a real deployment belongs in a secret manager.
    /// </summary>
    public string SigningKey { get; set; } = string.Empty;

    public int ExpiryMinutes { get; set; } = 60;
}
