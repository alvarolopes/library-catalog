using LibraryCatalog.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LibraryCatalog.Infrastructure.Persistence;

public class GenreConfiguration : IEntityTypeConfiguration<Genre>
{
    public void Configure(EntityTypeBuilder<Genre> builder)
    {
        builder.ToTable("genres");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .HasColumnType("citext")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(g => g.Description)
            .HasMaxLength(500);

        builder.HasIndex(g => g.Name).IsUnique();
    }
}
