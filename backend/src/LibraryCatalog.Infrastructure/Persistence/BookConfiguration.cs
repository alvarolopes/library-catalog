using LibraryCatalog.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LibraryCatalog.Infrastructure.Persistence;

public class BookConfiguration : IEntityTypeConfiguration<Book>
{
    public void Configure(EntityTypeBuilder<Book> builder)
    {
        builder.ToTable("books");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(b => b.Isbn)
            .HasMaxLength(13);

        // Unique only when present: PostgreSQL ignores nulls in a unique index,
        // so a filtered index gives "unique if provided" for free.
        builder.HasIndex(b => b.Isbn)
            .IsUnique()
            .HasFilter("isbn IS NOT NULL");

        builder.HasIndex(b => b.Title);

        // Deleting an author or genre must never silently delete their books.
        builder.HasOne(b => b.Author)
            .WithMany(a => a.Books)
            .HasForeignKey(b => b.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Genre)
            .WithMany(g => g.Books)
            .HasForeignKey(b => b.GenreId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
