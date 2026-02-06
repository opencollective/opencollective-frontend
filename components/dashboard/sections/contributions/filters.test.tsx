// Avoid loading PaymentMethodLabel and icon deps
jest.mock('../../filters/PaymentMethodFilter', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- mock factory runs before imports
  const z = require('zod');
  return {
    paymentMethodFilter: {
      schema: z.z.object({}).optional(),
      toVariables: (v: { service?: string; type?: string; manualPaymentProviderIds?: string[] }) => {
        if (!v?.service) {
          return {};
        }
        const base = { paymentMethodService: v.service, paymentMethodType: v.type };
        if (v.manualPaymentProviderIds?.length) {
          return { ...base, manualPaymentProvider: v.manualPaymentProviderIds.map(id => ({ id })) };
        }
        return base;
      },
    },
  };
});

import { PaymentMethodService, PaymentMethodType } from '../../../../lib/graphql/types/v2/schema';

import { schema, toVariables } from './filters';

describe('contributions filters', () => {
  describe('schema', () => {
    it('includes paymentMethod from filter', () => {
      const result = schema.safeParse({ paymentMethod: { service: 'STRIPE', type: 'CREDITCARD' } });
      expect(result.success).toBe(true);
    });
  });

  describe('toVariables.paymentMethod', () => {
    it('returns paymentMethodService and paymentMethodType only when no manualPaymentProviderIds', () => {
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
  });
});
