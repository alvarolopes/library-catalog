# Architecture decision records

One file per decision that has lasting consequences, in the order they were made.

An ADR is not a summary of what the code does — the [README](../../README.md) covers that, and it will be rewritten. An ADR records **when** a decision was taken, **what was rejected**, and **what would reverse it**, so a future maintainer can tell a deliberate choice from an accident and knows what new information would justify changing it.

Records are immutable. A decision that is later replaced gets `Status: Superseded by NNNN` rather than an edit; the trail is the point.

Each record states the consequence that is genuinely uncomfortable. One that lists only benefits is marketing.

| # | Decision | Status |
|---|---|---|
| [0001](0001-postgresql.md) | PostgreSQL over SQL Server and MySQL | Accepted |
| [0002](0002-three-layer-backend.md) | Three backend layers, no separate Domain project | Accepted |
| [0003](0003-concrete-repositories.md) | Concrete repositories, no interfaces | Accepted |
| [0004](0004-refuse-deletes-that-orphan-books.md) | Refuse deletes that would orphan books | Accepted |
| [0005](0005-public-reads-staff-writes.md) | Public reads, staff-only writes | Accepted |
| [0006](0006-token-in-session-storage.md) | Keep the SPA's token in `sessionStorage`, not in memory | Accepted — reverses an earlier decision |
| [0007](0007-migrations-on-startup.md) | Apply migrations on API startup | Accepted for this scope only |

## What is deliberately not here

Stack preferences that carry no architectural weight — Tailwind, Vitest over Jest, Shouldly over FluentAssertions — are explained in the README's trade-off table. Promoting every choice to an ADR dilutes the ones that matter.
