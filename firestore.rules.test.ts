/**
 * Phase 0 Security Test Suite verifying the Dirty Dozen payloads return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  docId: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unverified Email Spoof on Admin Email',
    collection: 'students',
    operation: 'create',
    auth: { uid: 'spoof-1', email: 'hnhamjaco@gmail.com', email_verified: false },
    docId: 'std-101',
    payload: { rollNo: '101', nameBn: 'রাফি', nameEn: 'Rafi' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Student Create',
    collection: 'students',
    operation: 'create',
    auth: { uid: 'user-1', email: 'teacher@school.edu', email_verified: true },
    docId: 'std-101',
    payload: { rollNo: '101', isSuperAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing on Payment Create',
    collection: 'payments',
    operation: 'create',
    auth: { uid: 'attacker-1', email: 'att@school.edu', email_verified: true },
    docId: 'pay-101',
    payload: { payerUid: 'victim-uid-999', amount: 1500, method: 'bkash' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Oversized ID Poisoning',
    collection: 'students',
    operation: 'create',
    auth: { uid: 'user-1', email: 'teacher@school.edu', email_verified: true },
    docId: 'a'.repeat(150),
    payload: { rollNo: '101' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'PII Blanket Read on Another User Student Document',
    collection: 'students',
    operation: 'get',
    auth: { uid: 'other-user', email: 'other@school.edu', email_verified: true },
    docId: 'std-owned-by-user-1',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Negative Tuition Fee Manipulation',
    collection: 'students',
    operation: 'create',
    auth: { uid: 'user-1', email: 'teacher@school.edu', email_verified: true },
    docId: 'std-102',
    payload: { dueAmount: -5000, monthlyFee: -100 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Timestamp Forgery on Notice Creation',
    collection: 'notices',
    operation: 'create',
    auth: { uid: 'user-1', email: 'teacher@school.edu', email_verified: true },
    docId: 'notice-1',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable Owner Mutation on Student Update',
    collection: 'students',
    operation: 'update',
    auth: { uid: 'user-1', email: 'teacher@school.edu', email_verified: true },
    docId: 'std-101',
    payload: { authorId: 'another-uid' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Terminal State Bypass on Resolved SupportMessage',
    collection: 'supportMessages',
    operation: 'update',
    auth: { uid: 'user-1', email: 'parent@school.edu', email_verified: true },
    docId: 'msg-resolved-1',
    payload: { text: 'Reopening resolved ticket without admin' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Value Poisoning on Attendance Update',
    collection: 'attendance',
    operation: 'update',
    auth: { uid: 'user-1', email: 'teacher@school.edu', email_verified: true },
    docId: 'att-1',
    payload: { status: 'invalid_enum_value' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Orphaned ExamAttempt Creation',
    collection: 'examAttempts',
    operation: 'create',
    auth: { uid: 'user-1', email: 'student@school.edu', email_verified: true },
    docId: 'attempt-1',
    payload: { examId: 'non-existent-exam-id' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Assigned Admin Escalation',
    collection: 'admins',
    operation: 'create',
    auth: { uid: 'user-1', email: 'attacker@school.edu', email_verified: true },
    docId: 'user-1',
    payload: { uid: 'user-1', email: 'attacker@school.edu', role: 'admin' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
