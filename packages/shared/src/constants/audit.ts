/**
 * Important actions recorded in the audit log. Add new ones here as features
 * arrive (e.g. EXAM_PUBLISHED, TIME_EXTENDED, MARKS_CHANGED, RESULTS_PUBLISHED).
 */
export const AuditAction = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  PASSWORD_RESET: 'PASSWORD_RESET',
  USER_APPROVED: 'USER_APPROVED',
  USER_DISABLED: 'USER_DISABLED',
  USER_ENABLED: 'USER_ENABLED',
  USER_REMOVED: 'USER_REMOVED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
