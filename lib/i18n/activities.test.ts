import { ActivityDescriptionI18n, ActivityTimelineMessageI18n, ActivityTypeI18n } from './activities';

describe('lib/i18n/activities', () => {
  describe('COLLECTIVE_EXPENSE_PAYMENT_ERROR', () => {
    it('reuses the payment failure sentence in the dashboard timeline', () => {
      expect(ActivityTimelineMessageI18n.COLLECTIVE_EXPENSE_PAYMENT_ERROR).toEqual(
        ActivityTimelineMessageI18n.COLLECTIVE_EXPENSE_ERROR,
      );
      expect(ActivityTimelineMessageI18n.COLLECTIVE_EXPENSE_PAYMENT_ERROR.avatar).toBe('fromAccount');
    });

    it('reuses the payment failure sentence in the activity log description', () => {
      expect(ActivityDescriptionI18n.COLLECTIVE_EXPENSE_PAYMENT_ERROR).toEqual(
        ActivityDescriptionI18n.COLLECTIVE_EXPENSE_ERROR,
      );
    });

    it('has a type label for the activity log filter', () => {
      expect(ActivityTypeI18n.COLLECTIVE_EXPENSE_PAYMENT_ERROR).toEqual({
        id: 'Expense.Activity.PaymentError',
        defaultMessage: 'Expense payment error',
      });
    });
  });
});
