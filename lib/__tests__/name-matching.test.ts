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

    it('rejects partial matches (extra or missing words)', () => {
      expect(areNamesMatching('John Smith', 'John Michael Smith')).toBe(false);
      expect(areNamesMatching('John Michael Smith', 'Smith John')).toBe(false);
      expect(areNamesMatching('John', 'John Smith')).toBe(false);
      expect(areNamesMatching('Sudharaka', 'Palamakumbura Sudharaka')).toBe(false);
      expect(areNamesMatching('Mr Smith', 'Mr John Smith')).toBe(false);
      expect(areNamesMatching('Acme Inc', 'Acme Inc Holdings')).toBe(false);
    });

    it('rejects abbreviated names', () => {
      expect(areNamesMatching('J. Smith', 'John Smith')).toBe(false);
      expect(areNamesMatching('John Smith', 'J. Smith')).toBe(false);
      expect(areNamesMatching('John M Smith', 'John Michael Smith')).toBe(false);
      expect(areNamesMatching('J.R.R. Tolkien', 'John Ronald Reuel Tolkien')).toBe(false);
      expect(areNamesMatching('J S', 'John Smith')).toBe(false);
    });

    it('rejects mismatches', () => {
      expect(areNamesMatching('John Smith', 'John Doe')).toBe(false);
      expect(areNamesMatching('John Smith', 'Jon Smith')).toBe(false);
      expect(areNamesMatching('John Smith', 'Smith Smith')).toBe(false);
      expect(areNamesMatching('Studio 1', 'Studio 100')).toBe(false);
    });

    it('keeps combining marks of non-Latin scripts', () => {
      expect(areNamesMatching('शिव कुमार', 'शिव कुमार')).toBe(true);
      expect(areNamesMatching('रवि शर्मा', 'रवी शर्मा')).toBe(false);
      expect(areNamesMatching('王 小明', '王五 小明')).toBe(false);
    });

    it('folds letters that do not decompose and ignores invisible characters', () => {
      expect(areNamesMatching('Straße Müller', 'Strasse Muller')).toBe(true);
      expect(areNamesMatching('Søren Łukasz', 'Soren Lukasz')).toBe(true);
      expect(areNamesMatching('Ja­ne Doe', 'Jane Doe')).toBe(true);
      expect(areNamesMatching('مُحَمَّد علي', 'محمد علي')).toBe(true);
    });

    it('handles single words and empty values', () => {
      expect(areNamesMatching('François', 'Francois')).toBe(true);
      expect(areNamesMatching('J S', 'j. s.')).toBe(true);
      expect(areNamesMatching('', 'John Smith')).toBe(false);
      expect(areNamesMatching('...', '!!!')).toBe(false);
      expect(areNamesMatching(null, undefined)).toBe(false);
    });
  });
});
