# 0006 — Keep the SPA's token in `sessionStorage`, not in memory

- **Status:** Accepted — reverses the position originally documented for [0005](0005-public-reads-staff-writes.md)
- **Date:** 2026-08-26

## Context

This record exists because the first answer was wrong, and the reasoning that corrected it is worth more than the conclusion.

The README originally stated that the SPA would hold the bearer token **in memory only**, with this justification:

> A token in localStorage is readable by any script that gets injected into the page, and with no refresh-token flow there is nothing to re-establish a session safely. The cost is that a page reload signs the user out — an accepted trade-off.

That was written before the login screen existed. Implementing it exposed the cost immediately: every page reload signed the user out. And examining the security argument that was supposed to justify that cost showed it does not hold.

**In-memory storage does not stop the attack it names.** The threat is a script injected into the page. Such a script runs in the same JavaScript context as the application. It can hook `fetch` and read the `Authorization` header off every outgoing request. It can walk React's internal state. It can simply wait and call the API itself using the victim's session. Reading `sessionStorage` is merely the most convenient of several equivalent options — closing it changes nothing about whether the attacker succeeds.

So the trade-off was not "less convenience for more security". It was "less convenience for the appearance of security".

## Decision

The token lives in `sessionStorage`. It survives a page reload; it does not survive closing the tab.

- The provider reads it on first render, discarding anything expired or unparseable
- Every storage access is wrapped in `try`/`catch` — private browsing and blocked site data both throw, and a missing session is not an error
- A timer signs the user out at expiry, so the UI never looks authenticated while every write would return 401

## Consequences

Reloading the page keeps the user signed in. Closing the tab does not.

**The uncomfortable one:** the token is readable by any script running on the page, and this decision says so rather than implying otherwise. The mitigation is not a different storage location — it is not putting the token in JavaScript's reach at all, which means an `httpOnly` cookie plus a refresh-token flow, plus the CSRF protection that pairing requires. That is real work and is listed as future work, not pretended away.

The README's security section was rewritten to state this reasoning, so the document argues the position rather than repeating the folk wisdom it originally repeated.

## Alternatives considered

**In memory only.** The original decision. Rejected once the security argument was examined rather than assumed. It costs a session on every reload and buys nothing against the threat it names.

**`localStorage`.** Same exposure as `sessionStorage`, but the session outlives the tab and persists on a shared machine until explicitly cleared. Rejected: strictly worse for no gain.

**`httpOnly` cookie with refresh tokens.** The correct answer, and the one that actually removes the token from script reach. Deferred — it needs a refresh endpoint, rotation, revocation and CSRF protection, which is a larger piece of work than the rest of the auth path combined.

## What would reverse this

Building the refresh-token flow. That is the point at which the `httpOnly` cookie becomes available, and this record gets superseded rather than edited.

## Note for anyone reading this later

The general lesson is not about token storage. It is that "the secure option" was accepted without asking what attack it prevented, and it survived being written into a design document unexamined. Implementing it is what surfaced the question. A decision that cannot survive being asked "which attack does this stop, and how?" should not be recorded as a security measure.
