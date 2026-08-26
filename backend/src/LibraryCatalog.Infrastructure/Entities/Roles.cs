namespace LibraryCatalog.Infrastructure.Entities;

/// <summary>
/// Separate from <see cref="User"/> so controllers can reference it without
/// colliding with <c>ControllerBase.User</c>.
/// </summary>
public static class Roles
{
    /// <summary>Catalog maintainer. Required for every write; reads are public.</summary>
    public const string Staff = "staff";
}
