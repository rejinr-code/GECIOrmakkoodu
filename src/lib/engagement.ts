export const COMMENT_MAX_LENGTH = 800;

export const FLAG_REASONS = [
  "Unkind or harassing",
  "Private information",
  "Does not belong on this photograph",
  "Spam or advertising",
] as const;

export type FlagReason = (typeof FLAG_REASONS)[number];

export function isFlagReason(value: string): value is FlagReason {
  return (FLAG_REASONS as readonly string[]).includes(value);
}
