namespace LibraryCatalog.Infrastructure.Entities;

public class Author : IAuditable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Name { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string? Nationality { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Book> Books { get; set; } = [];
}
