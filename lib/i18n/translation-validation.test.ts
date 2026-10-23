import { validateTranslation } from './translation-validation';

describe('validateTranslation', () => {
  it('accepts a translation with the same placeholders and tags', () => {
    expect(validateTranslation('Hello <b>{name}</b>', 'Bonjour <b>{name}</b>')).toEqual([]);
  });

  it('accepts reordered placeholders and plural branches', () => {
    expect(
      validateTranslation(
        '{count, plural, one {# contribution to {collective}} other {# contributions to {collective}}}',
        '{count, plural, one {{collective} : # contribution} other {{collective} : # contributions}}',
      ),
    ).toEqual([]);
  });

  it('allows non-breaking spaces used by French typography', () => {
    expect(validateTranslation('Amount: {amount}', 'Montant\u00A0: {amount}')).toEqual([]);
  });

  it('rejects empty translations', () => {
    expect(validateTranslation('Save', '  ')).toEqual(['translation is empty']);
  });

  it('rejects missing and unknown placeholders', () => {
    expect(validateTranslation('Paid by {name}', 'Payé par {nom}')).toEqual([
      'missing placeholders: {name}',
      'unknown placeholders: {nom}',
    ]);
  });

  it('rejects missing and unknown tags', () => {
    expect(validateTranslation('Read the <Link>docs</Link>', 'Lisez la <a>doc</a>')).toEqual([
      'missing tags: <Link>',
      'unknown tags: <a>',
    ]);
  });

  it('rejects invalid ICU syntax', () => {
    const [error] = validateTranslation('Hello {name}', 'Bonjour {name');
    expect(error).toMatch(/^invalid ICU message/);
  });

  it('rejects invisible characters introduced by the translation', () => {
    expect(validateTranslation('Settings', '\u200B\u200BConfigurações')).toEqual([
      'contains invisible characters: U+200B',
    ]);
    expect(validateTranslation('Bidi', 'Bidi\u00AD\u202E')).toEqual(['contains invisible characters: U+00AD, U+202E']);
  });

  it('keeps invisible characters that are already in the English source', () => {
    expect(validateTranslation('UTC\u200F', 'UTC\u200F')).toEqual([]);
  });
});
