namespace LibraryCatalog.Infrastructure.Entities;

/// <summary>
/// A catalog maintainer. Reads are public, so this exists only to gate writes.
/// </summary>
public class User : IAuditable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = Roles.Staff;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
