# Security Specification — El Dorado Model School Management System

## 1. Data Invariants

1. **Default-Deny Catch-All**: Every path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Enforcement**: Every write operation (`create`, `update`, `delete`) across all collections requires an authenticated user with `request.auth.token.email_verified == true`.
3. **Path Variable ID Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) validates its path variable against `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **No Blanket Reads & PII Isolation**: Collections containing PII (`students` with `guardianPhone`, `payments` with `walletNumber`, `supportMessages`) strictly restrict `get` and `list` to the document owner (`authorId == request.auth.uid`, `payerUid == request.auth.uid`, `senderUid == request.auth.uid`) or verified school administrators (`isAdmin()`).
5. **Strict Schema & Shadow-Field Blocking**: Every `create` and `update` invokes `isValid[Entity](incoming())`, enforcing `.keys().hasAll(...)` and `.keys().hasOnly(...)` along with strict string length bounds, numeric ranges, and regex patterns.
6. **Temporal Integrity**: All `createdAt` fields must equal `request.time` on `create` and remain immutable on `update`. All `updatedAt` fields must equal `request.time` on `create` and `update`.
7. **Terminal State Locking**: Payment records (`status in ['completed', 'refunded']`) and resolved support tickets (`status == 'resolved'`) lock further non-admin mutations once terminal state is reached.

## 2. The "Dirty Dozen" Payloads

1. **Unverified Email Spoof**: Authenticated user with `email: "hnhamjaco@gmail.com"` but `email_verified: false` attempting to create a student record.
2. **Shadow Field Injection on Student Create**: Valid student payload plus `"isSuperAdmin": true`.
3. **Identity Spoofing on Payment Create**: Setting `payerUid` to another user's UID (`"victim-uid-999"`).
4. **Oversized ID Poisoning**: Creating `/students/{150_char_id}` or an ID containing `$` / `/` characters.
5. **PII Blanket Read on Students**: Authenticated user `user-B` attempting `get` or `list` on a student record owned by `user-A`.
6. **Negative Tuition Fee Manipulation**: Creating or updating a student with `dueAmount: -5000` or `monthlyFee: -100`.
7. **Timestamp Forgery**: Providing a past or future client timestamp (`createdAt != request.time`) on notice creation.
8. **Immutable Owner Mutation**: Updating `authorId` or `createdAt` on an existing `/students/{studentId}` document.
9. **Terminal State Bypass on SupportMessage**: Non-admin user attempting to update a `SupportMessage` whose existing `status` is already `'resolved'`.
10. **Value Poisoning on Attendance Update**: Updating whitelisted key `status` with a 1MB string or invalid enum `"hacked"`.
11. **Orphaned ExamAttempt Creation**: Submitting an `/examAttempts/{attemptId}` referencing a non-existent `/exams/{examId}`.
12. **Self-Assigned Admin Escalation**: Non-admin user attempting to write a document into `/admins/{uid}` to grant themselves admin privileges.
