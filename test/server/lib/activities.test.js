import { expect } from 'chai';
import * as utils from '../../utils';
import constants from '../../../server/constants/activities';
import activitiesLib from '../../../server/lib/activities';

const activitiesData = utils.data('activities1').activities;

describe('server/lib/activities', () => {
  describe('formatMessageForPrivateChannel', () => {
    it(`${constants.COLLECTIVE_TRANSACTION_CREATED} donation`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[12], 'slack');
      expect(actual).to.equal(
        'New Donation: someone (john@doe.com) gave USD 10.42 to <https://opencollective.com/pubquiz|Pub quiz>!',
      );
    });

    it(`${constants.COLLECTIVE_EXPENSE_PAID} expense paid`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[14], 'slack');
      expect(actual).to.equal(
        "Expense paid on <https://opencollective.com/pubquiz|Pub quiz>: USD -12.98 for 'pizza' (150 USD remaining on preapproval key)",
      );
    });

    it(`${constants.USER_CREATED} all fields present`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[0], 'slack');
      expect(actual).to.equal('New user joined: <https://twitter.com/johndoe|John Doe> (john@doe.com)');
    });

    it(`${constants.USER_CREATED} only email present`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[1], 'slack');
      expect(actual).to.equal('New user joined: someone (john@doe.com)');
    });

    it(constants.WEBHOOK_STRIPE_RECEIVED, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[15], 'slack');
      expect(actual).to.equal('Stripe event received: invoice.payment_succeeded');
    });

    it(constants.SUBSCRIPTION_CONFIRMED, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[16], 'slack');
      expect(actual).to.equal(
        'New subscription confirmed: EUR 12.34 from someone (jussi@kuohujoki.fi) to <https://opencollective.com/blah|Blah>!',
      );
    });

    it(`${constants.SUBSCRIPTION_CONFIRMED} with month interval`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[17], 'slack');
      expect(actual).to.equal(
        'New subscription confirmed: EUR 12.34/month from <https://twitter.com/xdamman|xdamman> (jussi@kuohujoki.fi) to <https://opencollective.com/yeoman|Yeoman>!',
      );
    });

    it(`${constants.SUBSCRIPTION_CANCELLED}`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[18], 'slack');
      expect(actual).to.equal(
        'Subscription 4 canceled: EUR 12.34/month from <https://twitter.com/xdamman|xdamman> (jussi@kuohujoki.fi) to <https://opencollective.com/yeoman|Yeoman>',
      );
    });

    it(constants.COLLECTIVE_CREATED, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[19], 'slack');
      expect(actual).to.equal(
        'New collective created by someone (jussi@kuohujoki.fi): <https://opencollective.com/blah|Blah>',
      );
    });

    it(constants.COLLECTIVE_USER_ADDED, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[20], 'slack');
      expect(actual).to.equal(
        'New user: someone (UserId: 2) added to collective: <https://opencollective.com/blah|Blah>',
      );
    });

    it(`${constants.COLLECTIVE_EXPENSE_CREATED}`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[21], 'slack');
      expect(actual).to.equal('New Expense: someone submitted an expense to <blah.com|Blah>: EUR 12.34 for for pizza!');
    });

    it(`${constants.COLLECTIVE_EXPENSE_REJECTED}`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[22], 'slack');
      expect(actual).to.equal('Expense rejected: EUR 12.34 for for pizza in <blah.com|Blah> by userId: 2!');
    });

    it(`${constants.COLLECTIVE_EXPENSE_APPROVED}`, () => {
      const actual = activitiesLib.formatMessageForPrivateChannel(activitiesData[23], 'slack');
      expect(actual).to.equal('Expense approved: EUR 12.34 for for pizza in <blah.com|Blah> by userId: 2!');
    });
  });

  describe('formatMessageForPublicChannel', () => {
    it(`${constants.COLLECTIVE_TRANSACTION_CREATED} donation`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[12], 'slack');
      expect(actual).to.equal('New Donation: someone gave USD 10.42 to <https://opencollective.com/pubquiz|Pub quiz>!');
    });

    it(`${constants.COLLECTIVE_TRANSACTION_CREATED} expense`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[13], 'slack');
      expect(actual).to.equal(
        'New Expense: someone submitted an expense to <https://opencollective.com/pubquiz|Pub quiz>: USD -12.98 for pizza!',
      );
    });

    it(`${constants.COLLECTIVE_EXPENSE_PAID} expense paid`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[14], 'slack');
      expect(actual).to.equal("Expense paid on <https://opencollective.com/pubquiz|Pub quiz>: USD -12.98 for 'pizza'");
    });

    it(constants.SUBSCRIPTION_CONFIRMED, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[16], 'slack');
      expect(actual).to.equal(
        'New subscription confirmed: EUR 12.34 from someone to <https://opencollective.com/blah|Blah>!',
      );
    });

    it(`${constants.SUBSCRIPTION_CONFIRMED} with month interval`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[17], 'slack');
      expect(actual).to.equal(
        'New subscription confirmed: EUR 12.34/month from <https://twitter.com/xdamman|xdamman> to <https://opencollective.com/yeoman|Yeoman>! [<https://twitter.com/intent/tweet?status=%40xdamman%20thanks%20for%20your%20%E2%82%AC12.34%2Fmonth%20contribution%20to%20%40yeoman%20%F0%9F%91%8D%20https%3A%2F%2Fopencollective.com%2Fyeoman|Thank that person on Twitter>]',
      );
    });

    it(constants.COLLECTIVE_CREATED, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[19], 'slack');
      expect(actual).to.equal('New collective created by someone: <https://opencollective.com/blah|Blah>');
    });

    it(`${constants.COLLECTIVE_EXPENSE_CREATED}`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[21], 'slack');
      expect(actual).to.equal('New Expense: someone submitted an expense to <blah.com|Blah>: EUR 12.34 for for pizza!');
    });

    it(`${constants.COLLECTIVE_EXPENSE_REJECTED}`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[22], 'slack');
      expect(actual).to.equal('Expense rejected: EUR 12.34 for for pizza in <blah.com|Blah>!');
    });

    it(`${constants.COLLECTIVE_EXPENSE_APPROVED}`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[23], 'slack');
      expect(actual).to.equal('Expense approved: EUR 12.34 for for pizza in <blah.com|Blah>!');
    });
  });

  describe('formatMessageForPublicChannel gitter format', () => {
    it(`${constants.SUBSCRIPTION_CONFIRMED} with month interval for Gitter`, () => {
      const actual = activitiesLib.formatMessageForPublicChannel(activitiesData[17], 'markdown');
      expect(actual).to.equal(
        'New subscription confirmed: EUR 12.34/month from [xdamman](https://twitter.com/xdamman) to [Yeoman](https://opencollective.com/yeoman)! [[Thank that person on Twitter](https://twitter.com/intent/tweet?status=%40xdamman%20thanks%20for%20your%20%E2%82%AC12.34%2Fmonth%20contribution%20to%20%40yeoman%20%F0%9F%91%8D%20https%3A%2F%2Fopencollective.com%2Fyeoman)]',
      );
    });
  });
});
