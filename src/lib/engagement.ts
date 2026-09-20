export const COMMENT_MAX_LENGTH = 800;

export const FLAG_REASONS = [
  "Unkind or harassing",
  "Private information",
  "Does not belong here",
  "Spam or advertising",
] as const;

export type FlagReason = (typeof FLAG_REASONS)[number];

export type MemoryParent = "photo" | "article";

export function isFlagReason(value: string): value is FlagReason {
  return (FLAG_REASONS as readonly string[]).includes(value);
}

export function isMemoryParent(value: string): value is MemoryParent {
  return value === "photo" || value === "article";
}

export const THEME_MAX = 80;
export const PROMPT_BODY_MAX = 400;
