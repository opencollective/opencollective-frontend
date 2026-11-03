import { parseUniqueCompanies } from '../Hero';

describe('Hero.js', () => {
  describe('parseUniqueCompanies', () => {
    it('handles empty string/null/undefined correctly', () => {
      let companies = parseUniqueCompanies('');
      expect(companies).toEqual([]);

      companies = parseUniqueCompanies('     ');
      expect(companies).toEqual([]);

      companies = parseUniqueCompanies(null);
      expect(companies).toEqual([]);

      companies = parseUniqueCompanies(undefined);
      expect(companies).toEqual([]);
    });

    it('parses a single @ company correctly', () => {
      const companies = parseUniqueCompanies('@CompanyOne');

      expect(companies).toEqual(['@companyone']);
    });

    it('parses a single company without @ correctly', () => {
      const companies = parseUniqueCompanies('My Company Name');

      expect(companies).toEqual(['My Company Name']);
    });

    it('parses multiple @ companies correctly', () => {
      const companies = parseUniqueCompanies('@companyone @companytwo @companythree');

      expect(companies).toEqual(['@companyone', '@companytwo', '@companythree']);
    });

    it('parses companies with differing formats correctly', () => {
      let companies = parseUniqueCompanies('Founder at @companyone and @companytwo');
      expect(companies).toEqual(['Founder at', '@companyone', 'and', '@companytwo']);

      companies = parseUniqueCompanies('@companyone and @companytwo');
      expect(companies).toEqual(['@companyone', 'and', '@companytwo']);
    });

    it('preserves spacing', () => {
      const companies = parseUniqueCompanies('Some     big    spaces');

      expect(companies).toEqual(['Some     big    spaces']);
    });
  });
});
