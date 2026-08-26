# 0007 — Apply migrations on API startup

- **Status:** Accepted for this scope only
- **Date:** 2026-08-26

## Context

The brief requires configuration for local execution and instructions for database setup. The first thing a reviewer does is clone the repository and try to run it, and every manual step between `git clone` and a working application is a place that can go wrong on someone else's machine.

EF Core migrations are the source of truth for the schema — there is no hand-written DDL to drift. The question was only when to apply them.

## Decision

`Program.cs` runs `Database.MigrateAsync()` and then an idempotent seeder before the host starts serving.

The result is that `docker compose up --build` is genuinely the only command. No migration step, no seed script, no manual database creation. The catalogue is browsable immediately because the seeder inserts a small set of genres, authors and books.

The same path runs under `WebApplicationFactory` in the integration tests, so migrations and seeding are exercised on every test run rather than mocked away — which is how a broken migration would be caught.

## Consequences

**The uncomfortable one, and it is not small:** this is wrong for production, for two independent reasons.

Concurrent instances race. Two replicas starting together both attempt the migration; EF Core takes a lock, but the losing instance waits on startup and the behaviour under a partially applied migration is not something to discover during a deploy.

A failed migration takes the API down with it. The application cannot start, so a schema problem becomes an outage rather than a failed deployment step that can be rolled back while the previous version keeps serving.

Production belongs in a separate, gated deployment step with an explicit rollback plan. This is stated in the README's known limitations and in its trade-off table, because a reviewer finding it unstated would reasonably conclude it was not considered.

Seeding on every startup is safe because it is idempotent — it checks by natural key rather than inserting blindly — but it does mean the seeded records are shared state for the integration suite. Tests create their own uniquely named records rather than mutating the seeded ones, and the seeded set is treated as a read-only fixture.

## Alternatives considered

**A manual `dotnet ef database update` step.** Correct for production, and it was in the README's first draft. Rejected for this artefact because it adds a prerequisite — the .NET SDK and the `dotnet-ef` tool — to a setup that otherwise needs only Docker, and it is a step a reviewer can forget.

**Init SQL scripts mounted into the database container.** Would run before the API starts and needs no tooling. Rejected because it creates a second source of truth for the schema, which must then be kept in step with the migrations by hand — exactly the drift the migration history exists to prevent.

**A separate one-shot migration service in Compose**, running before the API. Closer to a production shape, and a reasonable middle ground. Rejected as more moving parts than this scope justifies, but it is the first thing to reach for if the setup grows.

## What would reverse this

Deploying anywhere real. More than one instance, or any environment where a bad migration must not take the service down. At that point the migration moves into the deployment pipeline and the startup call is deleted — a small change, deliberately kept small by leaving the migration history as the single source of truth.
