# 0003 — Concrete repositories, no interfaces

- **Status:** Accepted
- **Date:** 2026-08-26

## Context

Following [0002](0002-three-layer-backend.md), `Application` needs some way to reach the database. The reflex in a .NET codebase is an `IGenreRepository` interface in the inner layer with an EF Core implementation in the outer one.

Two observations argued against it here.

First, `DbContext` is already a Unit of Work and its `DbSet<T>` is already a repository. Wrapping it in an interface that a second implementation will never satisfy is indirection with no destination — PostgreSQL via EF Core is a one-way decision for this system, not a swappable dependency.

Second, the usual justification for the interface is testability: mock the repository, unit-test the service. That justification only holds if those unit tests are worth more than what they cost, which turned out not to be true here.

## Decision

`GenreRepository`, `AuthorRepository`, `BookRepository` and `UserRepository` are concrete classes in `Infrastructure`. `Application` services construct with them directly.

They still exist as a layer — they are not skipped in favour of injecting `DbContext` — because they keep LINQ and EF Core specifics out of `Application`. They take primitives (`search`, `sortBy`, `skip`, `take`) rather than `Application` types, which also keeps the dependency pointing one way.

## Consequences

**The uncomfortable one:** service orchestration cannot be unit-tested. There is no seam to mock, and creating one would mean marking methods `virtual` purely so a test double could override them — distorting production code to serve a test. So the rules that matter most — duplicate name yields conflict, missing reference yields not-found, delete with dependents is refused — are verified by the integration suite instead.

That has a knock-on cost: **`dotnet test` requires Docker**, because those tests start a PostgreSQL container. A contributor without Docker cannot run the backend suite at all. This is stated in the README next to the command.

It also has a benefit that was not the original motivation but turned out to matter: those tests run against a real database, so they catch things a mocked repository never could — the `citext` unique index actually rejecting a case-different duplicate, `RESTRICT` actually refusing an orphaning delete, LINQ actually translating.

The sort allowlist lives in the repository (`SortableColumns`) rather than in the validator, because the repository is what knows which columns it can order by. `Application` reads it to build the validator, which is a small dependency in the right direction.

## Alternatives considered

**`IGenreRepository` and friends.** The conventional choice. Rejected because the second implementation is imaginary; the interface would document a flexibility the system does not have and nobody would exercise.

**Inject `DbContext` directly into services.** Fewer moving parts, and defensible — `DbContext` is already the abstraction. Rejected because it would put LINQ query construction inside `Application`, spreading EF Core knowledge across both layers instead of confining it to one.

## What would reverse this

A genuine second implementation — an in-memory store for a hosted demo, a read replica with different query shapes, or replacing EF Core outright. At that point the interface stops being decoration and starts having something to abstract. Extracting one from a concrete class is mechanical; inventing one up front is not recoverable if it turns out to be the wrong shape.
