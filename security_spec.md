# Security Specification: Conductas Educativas Firestore Security

## 1. Data Invariants
1. `isAdmin`: User whose email is `andres.ramos.martin@gmail.com` with `email_verified == true` or holds an admin document has elevated administrative permissions.
2. `isSignedIn`: Operations require `request.auth != null && request.auth.token.email_verified == true`.
3. Strict string lengths and allowed keys must be enforced on all write operations across all collections.
4. An incident must have valid studentName, studentGroup, severity, and status.
5. Path IDs must be valid string identifiers (`isValidId`).
6. Numerical point values must adhere to boundary restrictions.

## 2. The Dirty Dozen Payloads
1. **Ghost Field in Incident**: Malicious payload adding `injected_escalation: true` to `/incidents/{id}`. (Must be rejected).
2. **Oversized String in Student**: Payload with a 15,000 character `name` in `/students/{id}` to execute denial-of-wallet. (Must be rejected).
3. **Unverified Email Access**: Write request where `email_verified` is `false`. (Must be rejected).
4. **Invalid Severity Enum**: Incident created with severity `Catastrophic`. (Must be rejected).
5. **Negative Minutes in Late Arrival**: Late arrival with `minutesLate: -50`. (Must be rejected).
6. **Malicious ID Path Poisoning**: Attempt to write to `/classes/../../../system_hack`. (Must be rejected).
7. **Role Spoofing in Profile**: Student attempting to escalate their own role to `SuperAdmin`. (Must be rejected).
8. **Invalid Status in Incident**: Setting `status: 'ApprovedByStudent'`. (Must be rejected).
9. **Directivo Note Tampering**: Non-directivo writing to system-reserved fields. (Must be rejected).
10. **Arbitrary Write to Unknown Path**: Write attempt to arbitrary root `/secrets/{id}`. (Must be rejected by global deny-all).
11. **Negative Positive Points**: Writing a positive behavior with `points: -500`. (Must be rejected).
12. **Malformed Behavior Type**: Creating behavior type with invalid category type `neutral`. (Must be rejected).
