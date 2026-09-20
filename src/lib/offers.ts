export const OFFER_TITLE_MAX = 80;
export const OFFER_BODY_MAX = 2000;
export const OFFER_NOTE_MAX = 400;
export const OFFERS_PAGE_SIZE = 20;

/** Offers and interest notes must not carry a public email or phone. */
export function looksLikeDirectContact(value: string): boolean {
  if (value.includes("@")) return true;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8;
}
