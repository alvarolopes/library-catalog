using FluentValidation;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Repositories;

namespace LibraryCatalog.Application.Genres;

public class CreateGenreRequestValidator : AbstractValidator<CreateGenreRequest>
{
    public CreateGenreRequestValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty()
            .Length(2, 100);

        RuleFor(r => r.Description)
            .MaximumLength(500);
    }
}

public class UpdateGenreRequestValidator : AbstractValidator<UpdateGenreRequest>
{
    public UpdateGenreRequestValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty()
            .Length(2, 100);

        RuleFor(r => r.Description)
            .MaximumLength(500);
    }
}

public class GenreListQueryValidator : AbstractValidator<GenreListQuery>
{
    public GenreListQueryValidator()
    {
        Include(new PageQueryValidator<GenreListQuery>(GenreRepository.SortableColumns));
    }
}
