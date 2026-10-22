import { addIgnoredEntries, readIgnoredEntries } from './ignored-ids';

const SOURCE = [
  'const IGNORED: Record<string, readonly string[]> = {',
  '  fr: [',
  `    'Avatar', // "Avatar" - identical`,
  `    'Email',`,
  '  ],',
  `  'pt-BR': [`,
  '  ],',
  '};',
  '',
].join('\n');

const KNOWN_IDS = new Set(['Avatar', 'Email', 'Legal', 'ACH Debit', "it's"]);

describe('readIgnoredEntries', () => {
  it('reads ids and reasons for one locale', () => {
    expect(readIgnoredEntries(SOURCE, 'fr')).toEqual({ Avatar: '"Avatar" - identical', Email: '' });
    expect(readIgnoredEntries(SOURCE, 'pt-BR')).toEqual({});
  });

  it('throws for a locale without a list', () => {
    expect(() => readIgnoredEntries(SOURCE, 'de')).toThrow('IGNORED list not found for locale de');
  });
});

describe('addIgnoredEntries', () => {
  it('appends new entries at the end of the locale list and skips existing ones', () => {
    const result = addIgnoredEntries(SOURCE, 'pt-BR', { Legal: 'identical', 'ACH Debit': '' }, KNOWN_IDS);
    expect(result).toEqual({
      source: SOURCE.replace(`  'pt-BR': [\n`, `  'pt-BR': [\n    'Legal', // identical\n    'ACH Debit',\n`),
      added: ['Legal', 'ACH Debit'],
      errors: [],
    });
    expect(addIgnoredEntries(SOURCE, 'fr', { Avatar: 'again' }, KNOWN_IDS).added).toEqual([]);
  });

  it('rejects unknown ids and ids that would break out of the string literal', () => {
    const result = addIgnoredEntries(SOURCE, 'fr', { "it's": '', Nope: '' }, KNOWN_IDS);
    expect(result.errors).toEqual(["it's: unsupported characters in message id", 'Nope: unknown message id']);
    expect(result.source).toBe(SOURCE);
  });

  it('keeps reasons on a single comment line', () => {
    const { source } = addIgnoredEntries(SOURCE, 'fr', { Legal: 'same\nprocess.exit(1)\u2028word' }, KNOWN_IDS);
    expect(readIgnoredEntries(source, 'fr').Legal).toBe('same process.exit(1) word');
    expect(source.split('\n')).toHaveLength(SOURCE.split('\n').length + 1);
  });
});
