# 0004 — Refuse deletes that would orphan books

- **Status:** Accepted
- **Date:** 2026-08-26

## Context

The brief requires that users can delete genres, authors and books, and states that additional validations may be proposed provided they are consistent with the domain.

It does not say what should happen when a genre or author still has books. Something has to, because the foreign keys are non-nullable: a book cannot exist without both.

## Decision

Deleting a genre or author that still has books is refused with `409 Conflict` and the problem type `resource-in-use`. The detail names the count:

> This genre cannot be deleted because 2 books still reference it.

Enforced in two places on purpose. The application service counts dependents first, so the user gets a clear conflict rather than a constraint violation. The foreign keys are configured `ON DELETE RESTRICT`, so a race between the check and the delete cannot slip through.

Deleting a book is unconditional — nothing references a book.

## Consequences

**The uncomfortable one:** the user has to clear or reassign an author's books before removing the author. That is more clicks, and for a catalog being tidied up it may be several. No bulk reassignment is offered.

The count in the message is the useful part, and it comes from the server. The SPA surfaces the server's own wording rather than substituting a generic failure, so the user learns *how much* is in the way, not merely that something is.

The two-layer enforcement means the database guarantee holds even for callers that bypass the service — a migration script, a future background job, or a bug.

## Alternatives considered

**Cascade delete.** Rejected outright. Deleting an author would silently destroy their entire catalogue on a single click, with no warning and no undo. The worst possible default for a system whose purpose is to preserve records.

**Soft delete.** Genuinely defensible, and the strongest of the three. Rejected on cost: it turns every read into a filtered read, every unique index into a partial one, and every foreign key into a question about whether the target is still live. That is real, permanent complexity spread across the whole system, bought to solve a problem this scope does not have. It is also the alternative that would most improve the product if the scope grew — see below.

**Nullable foreign keys**, so deleting an author leaves books with no author. Rejected because a book without an author is not a meaningful catalogue record, and it would push the null check into every consumer.

## What would reverse this

Two things, independently.

Wanting deletion to be recoverable — an accidental removal that has to be undone, or an audit requirement — argues for soft delete, and at that point the complexity is being bought for a reason.

Wanting bulk maintenance — merging duplicate authors, retiring a genre by moving its books elsewhere — argues for a reassignment operation before deletion rather than a change to this rule. That would keep the guard and make it easier to satisfy, which is the better answer to the discomfort noted above.
