import { areNamesMatching } from '../name-matching';

describe('name-matching', () => {
  describe('areNamesMatching', () => {
    it('ignores case, accents, punctuation, extra spaces and order', () => {
      expect(areNamesMatching('François  Dêaccènt', 'francois deaccent')).toBe(true);
      expect(areNamesMatching('Evil Corp, Inc', 'Evil Corp, Inc.')).toBe(true);
      expect(areNamesMatching('Piouffle, Benjamin', 'Benjamin Piouffle')).toBe(true);
      expect(areNamesMatching("Conan O'Brien", 'Conan OBrien')).toBe(true);
      expect(areNamesMatching('Jean-Luc Picard', 'Jean Luc Picard')).toBe(true);
      expect(areNamesMatching('JHipster Inc. 501(c)(3)', 'JHipster Inc.')).toBe(true);
    });

    it('accepts partial matches of at least two words', () => {
      expect(areNamesMatching('John Smith', 'John Michael Smith')).toBe(true);
      expect(areNamesMatching('John Michael Smith', 'Smith John')).toBe(true);
      expect(areNamesMatching('J. Smith', 'John Smith')).toBe(true);
      expect(areNamesMatching('John Smith', 'J. Smith')).toBe(true);
      expect(areNamesMatching('John M Smith', 'J Michael Smith')).toBe(true);
      expect(areNamesMatching('John M Smith', 'John Michael Smith')).toBe(true);
      expect(areNamesMatching('John J Smith', 'J James Smith')).toBe(true);
      expect(areNamesMatching('J.R.R. Tolkien', 'John Ronald Reuel Tolkien')).toBe(true);
      expect(areNamesMatching('John Ronald Reuel Tolkien', 'J.R.R. Tolkien')).toBe(true);
    });

    it('rejects mismatches', () => {
      expect(areNamesMatching('John Smith', 'John Doe')).toBe(false);
      expect(areNamesMatching('John', 'John Smith')).toBe(false);
      expect(areNamesMatching('Smith', 'John Smith')).toBe(false);
      expect(areNamesMatching('John Smith', 'Jon Smith')).toBe(false);
      expect(areNamesMatching('John Smith', 'Smith Smith')).toBe(false);
      expect(areNamesMatching('J S', 'John Smith')).toBe(false);
      expect(areNamesMatching('Studio 1', 'Studio 100')).toBe(false);
      expect(areNamesMatching('Studio 100', 'Studio 1')).toBe(false);
      expect(areNamesMatching('John Smith', 'J S')).toBe(false);
    });

    it('keeps combining marks of non-Latin scripts', () => {
      expect(areNamesMatching('शिव कुमार', 'शिव कुमार')).toBe(true);
      expect(areNamesMatching('रवि शर्मा', 'रवी शर्मा')).toBe(false);
    });

    it('does not blow up on adversarial names', () => {
      const start = Date.now();
      expect(areNamesMatching(`Smith ${'J '.repeat(15)}Zebra`, `Smith ${'John '.repeat(15)}Other`)).toBe(false);
      expect(areNamesMatching(`Smith ${'J '.repeat(15)}`, `Smith ${'John '.repeat(15)}`)).toBe(true);
      expect(Date.now() - start).toBeLessThan(500);
    });

    it('limits extra words and ignores generic words as anchors', () => {
      expect(areNamesMatching('John Smith', 'Mallory Jones John Smith')).toBe(true); // 2 extra words is the limit
      expect(areNamesMatching('John Smith', 'Mallory Jones Anne John Smith')).toBe(false);
      expect(areNamesMatching('John Smith', 'Mallory John Smith')).toBe(true);
      expect(areNamesMatching('A LLC', 'Anything Else LLC')).toBe(false);
      expect(areNamesMatching('Mr Smith', 'Mr John Smith')).toBe(true);
      expect(areNamesMatching('de la', 'Juan de la Cruz')).toBe(false);
    });

    it('does not treat single CJK characters as initials', () => {
      expect(areNamesMatching('王 小明', '王五 小明')).toBe(false);
    });

    it('folds letters that do not decompose and ignores invisible characters', () => {
      expect(areNamesMatching('Straße Müller', 'Strasse Muller')).toBe(true);
      expect(areNamesMatching('Søren Łukasz', 'Soren Lukasz')).toBe(true);
      expect(areNamesMatching('Ja\u00ADne Doe', 'Jane Doe')).toBe(true);
    });

    it('only compares for equality names with too many words', () => {
      const longName = 'Smith '.repeat(30).trim();
      expect(areNamesMatching(longName, longName)).toBe(true);
      expect(areNamesMatching(longName, `${longName} Jones`)).toBe(false);
    });

    it('matches identical names made only of initials or generic words', () => {
      expect(areNamesMatching('J S', 'j. s.')).toBe(true);
      expect(areNamesMatching('Mr Dr', 'Dr Mr')).toBe(true);
    });

    it('handles single words and empty values', () => {
      expect(areNamesMatching('François', 'Francois')).toBe(true);
      expect(areNamesMatching('', 'John Smith')).toBe(false);
      expect(areNamesMatching(null, undefined)).toBe(false);
    });
  });
});
