import { createIntl } from 'react-intl';

import { getDefaultFileName, getFilesFromExpense } from '../expenses';

describe('lib/expenses', () => {
  const intl = createIntl({ locale: 'en' });

  describe('getDefaultFileName', () => {
    it('uses the file name from CSV links (e.g. settlement exports)', () => {
      const url = 'https://rest.opencollective.com/v2/platform-tips/transactions.csv?kind=PLATFORM_TIP&fetchAll=1';
      expect(getDefaultFileName(intl, 0, 1, url)).toBe('transactions.csv');
    });

    it('keeps the raw file name when it cannot be decoded', () => {
      expect(getDefaultFileName(intl, 0, 1, 'https://rest.opencollective.com/v2/acme/100%.csv')).toBe('100%.csv');
      expect(getDefaultFileName(intl, 0, 1, 'https://rest.opencollective.com/v2/acme/my%20report.csv')).toBe(
        'my report.csv',
      );
    });

    it('falls back on a generic name for other files', () => {
      expect(getDefaultFileName(intl, 0, 1, 'https://opencollective.com/api/files/abc123')).toBe('Attached file');
      expect(getDefaultFileName(intl, 1, 2)).toBe('Attached file 2');
    });
  });

  describe('getFilesFromExpense', () => {
    it('names attached CSV links after their file', () => {
      const url = 'https://rest.opencollective.com/v2/platform-tips/transactions.csv?fetchAll=1';
      const files = getFilesFromExpense({ items: [], attachedFiles: [{ id: 'file-1', url, name: null }] }, intl);
      expect(files).toEqual([expect.objectContaining({ url, name: 'transactions.csv' })]);
    });
  });
});
