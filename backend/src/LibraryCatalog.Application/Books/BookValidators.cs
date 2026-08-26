using FluentValidation;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Repositories;

namespace LibraryCatalog.Application.Books;

public class CreateBookRequestValidator : AbstractValidator<CreateBookRequest>
{
    public CreateBookRequestValidator()
    {
        RuleFor(r => r.Title)
            .NotEmpty()
            .Length(1, 200);

        RuleFor(r => r.Isbn)
            .Must(Isbn.IsValid)
            .When(r => !string.IsNullOrWhiteSpace(r.Isbn))
            .WithMessage("Must be a valid ISBN-10 or ISBN-13.");

        RuleFor(r => r.PublicationYear)
            .InclusiveBetween(BookRules.EarliestPublicationYear, DateTime.UtcNow.Year + 1)
            .When(r => r.PublicationYear.HasValue);

        RuleFor(r => r.AuthorId).NotEmpty();
        RuleFor(r => r.GenreId).NotEmpty();
    }
}

public class UpdateBookRequestValidator : AbstractValidator<UpdateBookRequest>
{
    public UpdateBookRequestValidator()
    {
        RuleFor(r => r.Title)
            .NotEmpty()
            .Length(1, 200);

        RuleFor(r => r.Isbn)
            .Must(Isbn.IsValid)
            .When(r => !string.IsNullOrWhiteSpace(r.Isbn))
            .WithMessage("Must be a valid ISBN-10 or ISBN-13.");

        RuleFor(r => r.PublicationYear)
            .InclusiveBetween(BookRules.EarliestPublicationYear, DateTime.UtcNow.Year + 1)
            .When(r => r.PublicationYear.HasValue);

        RuleFor(r => r.AuthorId).NotEmpty();
        RuleFor(r => r.GenreId).NotEmpty();
    }
}

public class BookListQueryValidator : AbstractValidator<BookListQuery>
{
    public BookListQueryValidator()
    {
        Include(new PageQueryValidator<BookListQuery>(BookRepository.SortableColumns));
    }
}

public static class BookRules
{
    /// <summary>Gutenberg's press is a defensible floor for a printed book.</summary>
    public const int EarliestPublicationYear = 1450;
}
