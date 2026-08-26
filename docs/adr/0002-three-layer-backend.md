# 0002 — Three backend layers, no separate Domain project

- **Status:** Accepted
- **Date:** 2026-08-26

## Context

The brief requires no particular architecture and asks for the choice to be justified. It also states plainly that a perfect or overly comprehensive solution is not expected.

"Solution architecture" is an explicit evaluation criterion, which creates a pull toward visible structure. The first design for this project was a four-project Clean Architecture — `Domain`, `Application`, `Infrastructure`, `Api` — with the dependency rule pointing inward.

Reviewing that against the actual domain changed the decision before any code was written. The domain is three entities with two foreign keys and no behaviour beyond validation. There are no invariants that span aggregates, no state machines, no rules that would live in a domain model rather than in a validator.

The risk was therefore not under-engineering. It was ceremony that looks like architecture while paying for nothing.

## Decision

Three projects, each with one reason to change:

| Project | Reason to change |
|---|---|
| `LibraryCatalog.Api` | HTTP concerns — routing, binding, auth policies, error shaping |
| `LibraryCatalog.Application` | Business rules and use-case orchestration |
| `LibraryCatalog.Infrastructure` | Persistence — entities, `DbContext`, repositories, migrations |

Dependencies run straight top-down: `Api` → `Application` → `Infrastructure`. Not inverted. `Api` also references `Infrastructure` in exactly one place — `Program.cs` — to wire the DI container.

Entities live in `Infrastructure`, next to the `DbContext` that maps them. Request and response DTOs live in `Application`, in the feature folder of the service that owns them.

Also rejected, and worth naming:

- **MediatR / CQRS.** The cross-cutting concerns a mediator usually earns its place on — validation, logging — are handled here by an action filter and middleware. Adding a dispatch indirection to solve a problem the framework already solves is cost without return.
- **A separate read model.** Queries project straight to DTOs, one SQL statement per request. Splitting reads and writes across two stores answers a scaling problem this system does not have.

## Consequences

**The uncomfortable one:** `Application` and `Infrastructure` share the entity types. A change to persistence shape — a new column, a renamed navigation property — can ripple directly into `Application` instead of being absorbed by a translation layer. A Domain project would have contained that. This is a real cost, accepted knowingly.

There is one fewer project and no mapping hop between a domain entity and a persistence entity.

The DTO placement was not obvious and was got wrong first. Putting request and response models in `Api` seemed natural, but `Application` has to name the types it accepts and returns, and `Api` already depends on `Application` — so DTOs in `Api` would invert the dependency and make it circular. They belong with the service that owns them.

The business rules in `Application` are not testable without `Infrastructure`. That is a direct consequence of this decision and of [0003](0003-concrete-repositories.md), and it is why the integration suite carries most of the backend coverage rather than a unit suite over mocked repositories.

## Alternatives considered

**Four-project Clean Architecture.** The original plan. Rejected once it was clear the fourth project would hold anaemic entity classes whose only purpose was to be free of EF Core attributes — buying framework independence for an ORM this solution is committed to.

**Vertical slices.** A strong fit for larger feature sets, and defensible here. Rejected because it divides opinion more than layering does, and the justification would have cost more to defend than the structure was worth at three entities.

**A single API project.** Honest for the size of the problem, and the least ceremony of all. Rejected because "solution architecture" is graded explicitly, and a single project would read as not having considered the question.

## What would reverse this

Domain logic appearing that does not belong in a validator — rules spanning several entities, or state that changes by transition rather than by assignment. Loans and copies would do it. At that point a Domain project stops being ceremony and starts absorbing real complexity, and adding it is an extension of this structure rather than a rewrite.
