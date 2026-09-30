/** Lifecycle of an exam, from first draft to archive. */
export const ExamStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  MARKING: 'MARKING',
  RESULTS_READY: 'RESULTS_READY',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ExamStatus = (typeof ExamStatus)[keyof typeof ExamStatus];

/** Lifecycle of one student's attempt at an exam. */
export const AttemptStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  OFFLINE: 'OFFLINE',
  SUBMITTED: 'SUBMITTED',
  AUTO_SUBMITTED: 'AUTO_SUBMITTED',
  FORCE_SUBMITTED: 'FORCE_SUBMITTED',
  MARKED: 'MARKED',
} as const;

export type AttemptStatus = (typeof AttemptStatus)[keyof typeof AttemptStatus];
