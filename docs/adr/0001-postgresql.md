# 0001 — PostgreSQL over SQL Server and MySQL

- **Status:** Accepted
- **Date:** 2026-08-26

## Context

The brief requires a relational database and names three permitted options — SQL Server, PostgreSQL, MySQL — and requires the choice to be justified.

All three model this domain correctly. Three tables, two foreign keys, one unique index and a case-insensitive name comparison: nothing here strains any of them. So the decision could not be made on capability, and had to be made on something else.

The thing that actually differs is the cost imposed on whoever runs the project — the reviewer today, and the test suite on every run.

## Decision

PostgreSQL 17, via the Npgsql provider for EF Core.

Three reasons, in order of weight:

1. **Startup cost.** The `postgres:17-alpine` image is roughly 150 MB and accepts connections within a couple of seconds. That is what makes `docker compose up` a realistic single command, and what makes a Testcontainers-backed integration suite fast enough that people actually run it. SQL Server's Linux image is an order of magnitude larger and materially slower to start; in a suite that spins a container up per run, that difference is the difference between running the tests and skipping them.
2. **No licensing friction.** Nothing to accept, no edition to pick, no restriction to explain to a reviewer.
3. **Provider maturity.** Npgsql covers the constructs used here — `citext` for case-insensitive uniqueness, `timestamptz`, UUID keys, and correct translation of the filter and sort expressions behind the list endpoints.

## Consequences

**The uncomfortable one:** this is the wrong choice for a shop already standardised on SQL Server. Platform alignment — existing licences, DBA expertise, backup and monitoring tooling, deployment runbooks — outweighs every advantage listed above, and in that context the honest answer is to pick SQL Server without hesitation. This decision optimises for a reviewer cloning a repository, which is not the same thing as optimising for an organisation running a system.

The choice is contained. It lives entirely in `LibraryCatalog.Infrastructure`: a provider package, a connection string, regenerated migrations, and the two `citext` column mappings. Nothing in `Application` or `Api` refers to PostgreSQL.

`citext` is the one PostgreSQL-specific construct with no direct equivalent elsewhere. On SQL Server the same behaviour comes from a case-insensitive collation; on MySQL it is the default. Either way it is a line in an entity configuration, not a redesign.

## Alternatives considered

**SQL Server** — the natural pairing with .NET and the likeliest fit for the evaluating organisation. Rejected on setup cost for this specific artefact, not on merit. See the uncomfortable consequence above.

**MySQL** — light and fast to start, but the EF Core provider is third-party (Pomelo) with less coverage, and in a .NET context the justification is weaker than either alternative. No reason here that PostgreSQL does not serve better.

## What would reverse this

Being adopted by a team that already runs SQL Server or MySQL in production. The migration is contained to `Infrastructure` and would be measured in hours, not days — which is itself part of why the decision was safe to make quickly.
