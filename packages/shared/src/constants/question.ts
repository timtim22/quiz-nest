export const QuestionType = {
  MCQ: 'MCQ',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  LONG_ANSWER: 'LONG_ANSWER',
} as const;

export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

/** Question types the server marks automatically; the rest are marked by the teacher. */
export const AUTO_MARKED_QUESTION_TYPES: readonly QuestionType[] = [
  QuestionType.MCQ,
  QuestionType.TRUE_FALSE,
];

export const Difficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const ContentLanguage = {
  ENGLISH: 'en',
  URDU: 'ur',
  MIXED: 'mixed',
} as const;

export type ContentLanguage = (typeof ContentLanguage)[keyof typeof ContentLanguage];
