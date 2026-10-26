import { AuditAction, type UserStatus } from '@quiz-nest/shared';

/** How each audit action reads in the log. Unknown actions fall back to their code. */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  [AuditAction.USER_REGISTERED]: 'Signed up',
  [AuditAction.USER_LOGGED_IN]: 'Logged in',
  [AuditAction.PASSWORD_RESET]: 'Reset their password',
  [AuditAction.USER_APPROVED]: 'Approved an account',
  [AuditAction.USER_DISABLED]: 'Disabled an account',
  [AuditAction.USER_ENABLED]: 'Enabled an account',
  [AuditAction.USER_REMOVED]: 'Removed an account',
  [AuditAction.SETTINGS_UPDATED]: 'Changed settings',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  PENDING: 'Waiting for approval',
  DISABLED: 'Disabled',
};
