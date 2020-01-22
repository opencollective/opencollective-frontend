import { expect } from 'chai';
import { sanitizeActivity, enrichActivity } from '../../../server/lib/webhooks';
import { activities } from '../../../server/constants';

describe('server/lib/webhooks', () => {
  describe('sanitizeActivity', () => {
    it('Strips the data for unknown types', () => {
      const sanitized = sanitizeActivity({ type: 'NOT_A_VALID_TYPE', data: { hello: 'world' } });
      expect(sanitized.data).to.be.empty;
    });

    it('COLLECTIVE_TRANSACTION_CREATED', () => {
      const sanitized = sanitizeActivity({
        type: activities.COLLECTIVE_MEMBER_CREATED,
        data: {
          order: { totalAmount: 4200 },
          member: {
            role: 'BACKER',
            memberCollective: {
              id: 42,
            },
          },
        },
      });

      expect(sanitized.data.order.totalAmount).to.eq(4200);
      expect(sanitized.data.member.memberCollective.id).to.eq(42);
      expect(sanitized.data.collective).to.not.exist;
    });
  });

  describe('enrichActivity', () => {
    it('add formattedAmount field', () => {
      const activity = {
        type: 'DoesNotReallyMatter',
        data: {
          normal: { totalAmount: 4200, currency: 'USD' },
          withInterval: { amount: 5000, currency: 'EUR', interval: 'month' },
          withoutCurrency: { amount: 150 },
        },
      };

      const enrichedActivity = enrichActivity(activity);
      expect(enrichedActivity).to.eq(activity); // base object is mutated
      expect(enrichedActivity).to.deep.eqInAnyOrder({
        type: 'DoesNotReallyMatter',
        data: {
          normal: {
            totalAmount: 4200,
            currency: 'USD',
            formattedAmount: '$42.00',
            formattedAmountWithInterval: '$42.00',
          },
          withInterval: {
            amount: 5000,
            currency: 'EUR',
            interval: 'month',
            formattedAmount: '€50.00',
            formattedAmountWithInterval: '€50.00 / month',
          },
          withoutCurrency: {
            amount: 150,
            formattedAmount: '1.50',
            formattedAmountWithInterval: '1.50',
          },
        },
      });
    });
  });
});
