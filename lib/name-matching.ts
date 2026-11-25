/**
 * Name comparison helper. Keep the matching rules in sync with the API (opencollective-api/server/lib/name-matching.ts).
 */

// Letters that don't decompose into a base letter + accent
const LETTER_FOLDS: Record<string, string> = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ð: 'd', đ: 'd', ł: 'l', þ: 'th' };

// Names with more words than this are only compared for equality (bounds the matching cost)
const MAX_NAME_TOKENS = 20;

// Partial matches can't have more than this number of extra words on the longest name
const MAX_EXTRA_TOKENS = 2;

// Titles, particles and legal suffixes are too generic to anchor a partial match
const GENERIC_TOKENS = new Set(
  'mr mrs ms miss mx dr prof sr jr ii iii iv de del della di da do dos das du la le les el al bin ibn van von der den het the and y e et of inc llc ltd limited corp corporation co company gmbh sa sas srl bv ab as oy ag plc pty'.split(
    ' ',
  ),
);

const tokenizeName = (name: string): string[] => {
  return name
    .replace(/501\(c\)\(3\)/gi, ' ')
    .replace(/\p{Cf}/gu, '') // Invisible format characters (soft hyphen, zero-width space...)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // Accents: "François" => "Francois"
    .replace(/[\u064B-\u065F\u0670\u05B0-\u05C7]/g, '') // Arabic and Hebrew vowel marks
    .toLowerCase()
    .replace(/[ßæœøðđłþ]/g, letter => LETTER_FOLDS[letter]) // "Straße" => "strasse", "Ø" => "o"
    .replace(/['’`]/g, '') // "O'Brien" => "obrien"
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ') // Separators ("Jean-Luc" => "jean luc"); marks stay attached to their letters
    .split(' ')
    .filter(Boolean);
};

// Only scripts that use initials (a single CJK character, for example, is a whole word)
const isInitial = (token: string): boolean =>
  token.length === 1 && /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}]/u.test(token);

const isTokenMatch = (tokenA: string, tokenB: string): boolean => {
  // A single letter is an abbreviation of any word starting with it, whichever side it is on
  return (
    tokenA === tokenB ||
    (isInitial(tokenA) && tokenB.startsWith(tokenA)) ||
    (isInitial(tokenB) && tokenA.startsWith(tokenB))
  );
};

/** One-to-one assignment of all `tokens` to `candidates` (bipartite matching, polynomial time) */
const assignTokens = (tokens: string[], candidates: string[]): boolean => {
  const tokenOfCandidate: number[] = candidates.map(() => -1);
  const tryAssign = (tokenIndex: number, visited: boolean[]): boolean => {
    for (let c = 0; c < candidates.length; c++) {
      if (!visited[c] && isTokenMatch(tokens[tokenIndex], candidates[c])) {
        visited[c] = true;
        if (tokenOfCandidate[c] === -1 || tryAssign(tokenOfCandidate[c], visited)) {
          tokenOfCandidate[c] = tokenIndex;
          return true;
        }
      }
    }
    return false;
  };
  return tokens.every((_, tokenIndex) =>
    tryAssign(
      tokenIndex,
      candidates.map(() => false),
    ),
  );
};

/**
 * Compares two full names, allowing partial matches. Names are considered a match when:
 *
 * 1) Case, accents, punctuation and extra spaces are ignored: "François  O'Brien" matches "francois obrien".
 * 2) Order is ignored: "Benjamin Piouffle" matches "Piouffle, Benjamin".
 * 3) All the words of the shortest name are found in the longest one (at least 2 words, to avoid matching
 *    on a first name only): "John Smith" matches "John Michael Smith".
 * 4) A single letter matches a word that starts with it: "J. Smith" matches "John Smith".
 *
 * Single-word names only match if they're identical. Returns `false` if one of the names is empty.
 */
export const areNamesMatching = (nameA: string | null | undefined, nameB: string | null | undefined): boolean => {
  const tokensA = tokenizeName(nameA || '');
  const tokensB = tokenizeName(nameB || '');
  if (!tokensA.length || !tokensB.length) {
    return false;
  }

  // Same words (ignoring case, accents, punctuation, spaces and order), same as `EXACT` in the API
  if (tokensA.length === tokensB.length && [...tokensA].sort().join(' ') === [...tokensB].sort().join(' ')) {
    return true;
  } else if (tokensA.length > MAX_NAME_TOKENS || tokensB.length > MAX_NAME_TOKENS) {
    return false;
  }

  const [shortTokens, longTokens] = tokensA.length <= tokensB.length ? [tokensA, tokensB] : [tokensB, tokensA];
  if (shortTokens.length < 2) {
    return longTokens.length === 1 && shortTokens[0] === longTokens[0];
  }
  if (longTokens.length - shortTokens.length > MAX_EXTRA_TOKENS) {
    return false;
  }

  // Reserve exact matches between full words first, then find a one-to-one assignment for the rest
  // (initials can match either side, e.g. "John J Smith" vs "J James Smith")
  const available = [...longTokens];
  const remaining: string[] = [];
  let hasFullWordMatch = false;
  for (const token of shortTokens) {
    const index = token.length > 1 ? available.indexOf(token) : -1;
    if (index === -1) {
      remaining.push(token);
    } else {
      hasFullWordMatch = hasFullWordMatch || !GENERIC_TOKENS.has(token);
      available.splice(index, 1);
    }
  }
  // Names made only of initials or generic words ("J S", "Mr Dr") are too ambiguous to be considered a match
  if (!hasFullWordMatch) {
    return false;
  }
  return assignTokens(remaining, available) ? true : false;
};
