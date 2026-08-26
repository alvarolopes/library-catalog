# 0005 — Public reads, staff-only writes

- **Status:** Accepted
- **Date:** 2026-08-26

## Context

Authentication is listed in the brief as a differentiator, not a requirement. So the question was not only *how* to add it but *whether*, and if so, where to draw the line.

A catalogue has a natural access pattern: the public browses it, staff maintain it. That is a real domain distinction, not an arbitrary one — which made it a better basis for the decision than the usual all-or-nothing default.

## Decision

Every `GET` is anonymous. Every `POST`, `PUT` and `DELETE` requires a bearer token carrying the `staff` role.

- JWT, HS256, short expiry, issued by `POST /api/v1/auth/login`
- Role-based policy applied per endpoint
- One staff user seeded, with credentials documented in the README
- Passwords hashed with ASP.NET Core's PBKDF2 `PasswordHasher`

## Consequences

A reviewer can `curl` the entire read surface immediately, without obtaining a token first. That was not the motivation but it is a real benefit, and it means the API is explorable before anyone reads the credentials section.

The authorization path is still exercised end to end — 401 without a token, 403 with a token lacking the role, 204 with one — so the differentiator is demonstrated rather than asserted. The integration suite asserts all three across every write endpoint.

In the SPA, write controls are hidden while signed out. **This is not a security boundary** — the API enforces the role regardless — it only avoids offering buttons that can answer nothing but 401.

**The uncomfortable one:** this is not a complete identity solution and should not be mistaken for one. One seeded user, no registration, no refresh tokens, no revocation, no rate limiting on login, no account lockout. The signing key sits in configuration rather than a secret manager. Each of those is listed in the README's known limitations, because a reviewer finding them unstated would reasonably assume they were overlooked.

A consequence discovered while implementing: authentication and authorization short-circuit the ASP.NET Core pipeline before any exception handler, so a 401 or 403 returned an empty body while every other error returned a problem document. That inconsistency was invisible until tested. It is fixed by writing the same envelope from `JwtBearerEvents`.

## Alternatives considered

**No authentication at all.** Legitimate — it is a differentiator, and skipping it with a written justification would have been defensible. Rejected because the access pattern above makes it cheap to add and coherent to explain, and because it exercises a graded capability.

**Everything behind authentication.** The conventional default. Rejected because it does not match how a catalogue works, and it would force a reviewer through a login before seeing anything.

**Per-resource permissions** rather than a single `staff` role. Rejected as ceremony: there is one kind of maintainer and nothing to differentiate between them.

## What would reverse this

Any part of the catalogue becoming non-public — unpublished records, per-tenant data, or borrower information — collapses the distinction this decision rests on, and reads would need protecting too. The role model would also need to grow the moment there is more than one kind of maintainer.
