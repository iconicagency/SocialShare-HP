# Security Specification - SocialSync

## Data Invariants
1. A configuration or source cannot exist without an `ownerId`.
2. Fetched items must belong to a specific source and owner.
3. Only authorized emails (`thanhnt.ads@gmail.com`, `mailanphamthi2@gmail.com`) should have broad access if requested, but for now, we enforce per-user isolation with an allowlist check for specialized operations if needed.

## The Dirty Dozen Payloads (Test Scenarios)
1. **Unauthenticated Read**: Try to read `sources/some-id` without login. (Expected: Deny)
2. **Identity Spoofing**: Logged in as User A, try to create a source with `ownerId: 'UserB'`. (Expected: Deny)
3. **Cross-User Read**: User A tries to read User B's items. (Expected: Deny)
4. **ID Poisoning**: Create a source with a 1MB string as ID. (Expected: Deny via `isValidId` though not strictly enforced in all paths yet).
5. **Unauthorized Email**: Logged in with `stranger@gmail.com`, try to access admin-only functions if any. (Expected: Deny)
6. **Immutable Field Update**: Try to change `ownerId` on an existing source. (Expected: Deny)
7. **Malformed Source**: Create source without `url` or `ownerId`. (Expected: Deny)
8. **Recursive Cost Attack**: Deeply nested document queries (Expected: Deny by default structure).
9. **Email Spoofing (Unverified)**: Use a token with unverified email if we added that check. (Expected: Deny)
10. **Shadow Field Injection**: Add `isVerified: true` to a source object where not allowed.
11. **Mass Deletion**: Trying to delete all items of another user.
12. **Terminal State Break**: If we had a "locked" status, trying to move it back to draft.

## Test Runner
A `firestore.rules.test.ts` following these principles will be created if needed, but for now, we will move to finalizing the rules.
