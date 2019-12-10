import { expect } from 'chai';
import { sanitizeActivity } from '../../../server/lib/webhooks';
import { activities } from '../../../server/constants';

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
