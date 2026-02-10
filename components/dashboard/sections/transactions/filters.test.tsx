/**
 * Tests the transactions filters schema and toVariables.
 * We only mock UI components that PaymentMethodFilter depends on so that the
 * real filter logic (schema + toVariables) is exercised.
 */
jest.mock('../../../PaymentMethodLabel', () => ({
  PaymentMethodLabel: () => null,
  PaymentMethodServiceLabel: () => null,
}));

import {
  ExpenseType,
  PaymentMethodService,
  PaymentMethodType,
  TransactionKind,
  TransactionType,
} from '../../../../lib/graphql/types/v2/schema';

import { AmountFilterType } from '../../filters/AmountFilter/schema';
import { DateFilterType } from '../../filters/DateFilter/schema';

import { schema, toVariables } from './filters';

describe('transactions filters', () => {
  describe('schema', () => {
    it('applies defaults for limit, offset and sort when given empty input', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
        expect(result.data.sort).toEqual({ field: 'CREATED_AT', direction: 'DESC' });
      }
    });

    it('accepts valid paymentMethod with service and type (real PaymentMethodFilter schema)', () => {
      const result = schema.safeParse({
        paymentMethod: { service: 'STRIPE', type: 'CREDITCARD' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paymentMethod).toEqual({ service: 'STRIPE', type: 'CREDITCARD' });
      }
    });

    it('accepts paymentMethod with manualPaymentProviderIds as array', () => {
      const result = schema.safeParse({
        paymentMethod: {
          service: PaymentMethodService.OPENCOLLECTIVE,
          type: PaymentMethodType.MANUAL,
          manualPaymentProviderIds: ['mp_1', 'mp_2'],
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paymentMethod?.manualPaymentProviderIds).toEqual(['mp_1', 'mp_2']);
      }
    });

    it('accepts paymentMethod with manualPaymentProviderIds as comma-separated string (real transform)', () => {
      const result = schema.safeParse({
        paymentMethod: {
          service: PaymentMethodService.OPENCOLLECTIVE,
          type: PaymentMethodType.MANUAL,
          manualPaymentProviderIds: 'mp_a, mp_b',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paymentMethod?.manualPaymentProviderIds).toEqual(['mp_a', 'mp_b']);
      }
    });

    it('accepts optional paymentMethod (undefined)', () => {
      const result = schema.safeParse({ paymentMethod: undefined });
      expect(result.success).toBe(true);
    });

    it('rejects invalid paymentMethod service enum', () => {
      const result = schema.safeParse({
        paymentMethod: { service: 'INVALID_SERVICE', type: 'CREDITCARD' },
      });
      expect(result.success).toBe(false);
    });

    it('accepts valid kind, type and expenseType', () => {
      const result = schema.safeParse({
        kind: [TransactionKind.CONTRIBUTION],
        type: TransactionType.CREDIT,
        expenseType: [ExpenseType.INVOICE],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kind).toEqual([TransactionKind.CONTRIBUTION]);
        expect(result.data.type).toBe(TransactionType.CREDIT);
        expect(result.data.expenseType).toEqual([ExpenseType.INVOICE]);
      }
    });
  });

  describe('toVariables', () => {
    describe('paymentMethod (real PaymentMethodFilter.toVariables)', () => {
      it('returns paymentMethodService and paymentMethodType when no manualPaymentProviderIds', () => {
        const out = toVariables.paymentMethod(
          { service: PaymentMethodService.OPENCOLLECTIVE, type: PaymentMethodType.MANUAL },
          'paymentMethod',
          undefined,
          {},
        );
        expect(out).toEqual({
          paymentMethodService: PaymentMethodService.OPENCOLLECTIVE,
          paymentMethodType: PaymentMethodType.MANUAL,
        });
      });

      it('returns manualPaymentProvider array when manualPaymentProviderIds has length', () => {
        const out = toVariables.paymentMethod(
          {
            service: PaymentMethodService.OPENCOLLECTIVE,
            type: PaymentMethodType.MANUAL,
            manualPaymentProviderIds: ['mp_1', 'mp_2'],
          },
          'paymentMethod',
          undefined,
          {},
        );
        expect(out).toEqual({
          paymentMethodService: PaymentMethodService.OPENCOLLECTIVE,
          paymentMethodType: PaymentMethodType.MANUAL,
          manualPaymentProvider: [{ id: 'mp_1' }, { id: 'mp_2' }],
        });
      });

      it('returns only base fields when value is undefined', () => {
        const out = toVariables.paymentMethod(undefined, 'paymentMethod', undefined, {});
        expect(out).toEqual({
          paymentMethodService: undefined,
          paymentMethodType: undefined,
        });
      });
    });

    describe('paymentMethodId', () => {
      it('maps ids to paymentMethod array of { id }', () => {
        const out = toVariables.paymentMethodId(['id_1', 'id_2'], 'paymentMethodId', undefined, {});
        expect(out).toEqual({
          paymentMethod: [{ id: 'id_1' }, { id: 'id_2' }],
        });
      });
    });

    describe('payoutMethodId', () => {
      it('maps id to payoutMethod object', () => {
        const out = toVariables.payoutMethodId('payout_123', 'payoutMethodId', undefined, {});
        expect(out).toEqual({ payoutMethod: { id: 'payout_123' } });
      });
    });

    describe('virtualCard', () => {
      it('maps ids to virtualCard array of { id }', () => {
        const out = toVariables.virtualCard(['vc_1', 'vc_2'], 'virtualCard', undefined, {});
        expect(out).toEqual({
          virtualCard: [{ id: 'vc_1' }, { id: 'vc_2' }],
        });
      });
    });

    describe('expenseId', () => {
      it('maps id to expense.legacyId', () => {
        const out = toVariables.expenseId(42, 'expenseId', undefined, {});
        expect(out).toEqual({ expense: { legacyId: 42 } });
      });
    });

    describe('orderId', () => {
      it('maps id to order.legacyId', () => {
        const out = toVariables.orderId(100, 'orderId', undefined, {});
        expect(out).toEqual({ order: { legacyId: 100 } });
      });
    });

    describe('date', () => {
      it('produces dateFrom/dateTo from date filter value', () => {
        const out = toVariables.date(
          {
            type: DateFilterType.EQUAL_TO,
            gte: '2024-06-01',
            lte: '2024-06-01',
            tz: 'local',
          },
          'date',
          undefined,
          {},
        );
        expect(out).toHaveProperty('dateFrom');
        expect(out).toHaveProperty('dateTo');
        expect(out.dateFrom).toContain('2024-06-01');
        expect(out.dateTo).toContain('2024-06-01');
      });
    });

    describe('clearedAt', () => {
      it('produces clearedFrom/clearedTo from date filter value', () => {
        const out = toVariables.clearedAt(
          {
            type: DateFilterType.EQUAL_TO,
            gte: '2024-01-15',
            lte: '2024-01-15',
            tz: 'local',
          },
          'clearedAt',
          undefined,
          {},
        );
        expect(out).toHaveProperty('clearedFrom');
        expect(out).toHaveProperty('clearedTo');
        expect(out.clearedFrom).toContain('2024-01-15');
        expect(out.clearedTo).toContain('2024-01-15');
      });
    });

    describe('amount', () => {
      it('produces amount.gte/lte from amount filter value', () => {
        const out = toVariables.amount(
          {
            type: AmountFilterType.IS_EQUAL_TO,
            gte: 1000,
            lte: 1000,
            currency: 'USD',
          },
          'amount',
          undefined,
          {},
        );
        expect(out).toEqual({
          amount: {
            gte: { valueInCents: 1000, currency: 'USD' },
            lte: { valueInCents: 1000, currency: 'USD' },
          },
        });
      });
    });
  });
});
