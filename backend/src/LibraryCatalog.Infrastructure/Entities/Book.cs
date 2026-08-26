namespace LibraryCatalog.Infrastructure.Entities;

public class Book : IAuditable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Title { get; set; } = string.Empty;
    public string? Isbn { get; set; }
    public int? PublicationYear { get; set; }

    public Guid AuthorId { get; set; }
    public Guid GenreId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Author Author { get; set; } = null!;
    public Genre Genre { get; set; } = null!;
}
