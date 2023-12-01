import {
  compareItemOCRValues,
  filterParsableItems,
  updateExpenseFormWithUploadResult,
} from '../../components/expenses/lib/ocr';

import { ExpenseType } from '../graphql/types/v2/graphql';

const uploadResult = {
  file: { url: 'https://example.com/file.pdf' },
  parsingResult: {
    expense: {
      description: 'Test expense',
      amount: { valueInCents: 1000, currency: 'USD' },
      date: '2022-01-01',
      items: [
        { description: 'Test item', amount: { valueInCents: 500, currency: 'USD' }, incurredAt: '2022-01-01' },
        { description: 'Test item 2', amount: { valueInCents: 500, currency: 'USD' }, incurredAt: '2022-01-01' },
      ],
    },
  },
};

const collective = {
  id: '1',
  slug: 'test-collective',
  name: 'Test Collective',
  currency: 'USD',
  settings: {},
};

const getForm = () => ({
  setValues: jest.fn(),
  values: {
    type: ExpenseType.RECEIPT,
    currency: 'USD',
    items: [{ description: 'Test item', amount: 500 }],
    attachedFiles: [],
    payoutMethod: null,
    payee: null,
    description: '',
  },
});

describe('OCR functions', () => {
  describe('updateExpenseFormWithUploadResult', () => {
    it('should update the form values with the upload result', () => {
      const form = getForm();
      const result = updateExpenseFormWithUploadResult(collective, form, [uploadResult]);
      expect(result).toBe(true);
      expect(form.setValues).toHaveBeenCalledWith({
        ...form.values,
        description: 'Test expense',
        items: [
          { description: 'Test item', amount: 500 },
          {
            __file: { url: 'https://example.com/file.pdf' },
            __isNew: true,
            __isUploading: false,
            __parsingResult: uploadResult.parsingResult.expense,
            amount: 1000,
            description: '',
            id: expect.any(String),
            incurredAt: '2022-01-01',
            url: 'https://example.com/file.pdf',
          },
        ],
      });
    });
  });

  describe('filterParsableItems', () => {
    it('should return only parsable items', () => {
      const items = [
        { description: 'Test item', amount: { valueInCents: null, currency: 'USD' } },
        { description: 'Test item 2', amount: { valueInCents: 500, currency: null } },
        { description: 'Test item 3', amount: null },
        { description: 'Test item 4', amount: { valueInCents: 500, currency: 'USD' } },
      ];
      const result = filterParsableItems(items);
      expect(result).toEqual([items[3]]);
    });
  });

  describe('compareItemOCRValues', () => {
    it('should return an object with no diffs', () => {
      const form = getForm();
      form.values.items = [
        {
          __file: { url: 'https://example.com/file.pdf' },
          __isNew: true,
          __isUploading: false,
          __parsingResult: uploadResult.parsingResult.expense,
          amount: 1000,
          description: 'Test expense',
          id: expect.any(String),
          incurredAt: '2022-01-01',
          url: 'https://example.com/file.pdf',
        },
      ];

      expect(compareItemOCRValues(form.values.items[0], 'USD')).toEqual({
        amount: { hasMismatch: false, ocrValue: { valueInCents: 1000, currency: 'USD' } },
        incurredAt: { hasMismatch: false, ocrValue: '2022-01-01' },
        description: { hasMismatch: false, ocrValue: 'Test expense' },
      });
    });

    it('should return an object with diffs on the global parsing result', () => {
      const form = getForm();
      form.values.items = [
        {
          __file: { url: 'https://example.com/file.pdf' },
          __isNew: true,
          __isUploading: false,
          __parsingResult: uploadResult.parsingResult.expense,
          amount: 500,
          description: 'Test expense edited',
          id: expect.any(String),
          incurredAt: '2022-02-01',
          url: 'https://example.com/file.pdf',
        },
      ];

      expect(compareItemOCRValues(form.values.items[0], 'USD')).toEqual({
        amount: { hasMismatch: true, ocrValue: { valueInCents: 1000, currency: 'USD' } },
        incurredAt: { hasMismatch: true, ocrValue: '2022-01-01' },
        description: { hasMismatch: true, ocrValue: 'Test expense' },
      });
    });
  });
});
