using FluentValidation;
using LibraryCatalog.Application.Common;
using LibraryCatalog.Infrastructure.Repositories;

namespace LibraryCatalog.Application.Authors;

public class CreateAuthorRequestValidator : AbstractValidator<CreateAuthorRequest>
{
    public CreateAuthorRequestValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty()
            .Length(2, 200);

        RuleFor(r => r.BirthDate)
            .LessThan(_ => DateOnly.FromDateTime(DateTime.UtcNow))
            .When(r => r.BirthDate.HasValue)
            .WithMessage("Must be in the past.");

        RuleFor(r => r.Nationality)
            .MaximumLength(100);
    }
}

public class UpdateAuthorRequestValidator : AbstractValidator<UpdateAuthorRequest>
{
    public UpdateAuthorRequestValidator()
    {
        RuleFor(r => r.Name)
            .NotEmpty()
            .Length(2, 200);

        RuleFor(r => r.BirthDate)
            .LessThan(_ => DateOnly.FromDateTime(DateTime.UtcNow))
            .When(r => r.BirthDate.HasValue)
            .WithMessage("Must be in the past.");

        RuleFor(r => r.Nationality)
            .MaximumLength(100);
    }
}

public class AuthorListQueryValidator : AbstractValidator<AuthorListQuery>
{
    public AuthorListQueryValidator()
    {
        Include(new PageQueryValidator<AuthorListQuery>(AuthorRepository.SortableColumns));
    }
}
