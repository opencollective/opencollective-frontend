/**
 * Name comparison helper. Keep the matching rules in sync with the API (opencollective-api/server/lib/name-matching.ts).
 */

// Letters that don't decompose into a base letter + accent
const LETTER_FOLDS: Record<string, string> = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ð: 'd', đ: 'd', ł: 'l', þ: 'th' };

const tokenizeName = (name: string): string[] => {
  return name
    .replace(/501\(c\)\(3\)/gi, ' ')
    .replace(/\p{Cf}/gu, '') // Invisible format characters (soft hyphen, zero-width space...)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Accents: "François" => "Francois"
    .replace(/[ً-ְٰٟ-ׇ]/g, '') // Arabic and Hebrew vowel marks
    .toLowerCase()
    .replace(/[ßæœøðđłþ]/g, letter => LETTER_FOLDS[letter]) // "Straße" => "strasse", "Ø" => "o"
    .replace(/['’`]/g, '') // "O'Brien" => "obrien"
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ') // Separators ("Jean-Luc" => "jean luc"); marks stay attached to their letters
    .split(' ')
    .filter(Boolean);
};

/**
 * Compares two full names. They match only when they have exactly the same words, ignoring case, accents,
 * punctuation, extra spaces and order: "François  O'Brien" vs "francois obrien", or "Benjamin Piouffle"
 * vs "Piouffle, Benjamin".
 *
 * Partial or abbreviated names ("John Smith" vs "John Michael Smith", "J. Smith" vs "John Smith") are
 * intentionally reported as mismatches: we prefer false-positive warnings over false negatives.
 * Empty names never match.
 */
export const areNamesMatching = (nameA: string | null | undefined, nameB: string | null | undefined): boolean => {
  const tokensA = tokenizeName(nameA || '');
  const tokensB = tokenizeName(nameB || '');
  return (
    tokensA.length > 0 &&
    tokensA.length === tokensB.length &&
    [...tokensA].sort().join(' ') === [...tokensB].sort().join(' ')
  );
};
