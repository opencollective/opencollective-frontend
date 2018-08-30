import { expect } from 'chai';

/* Support code */
import models from '../server/models';

/* Test tools */
import * as utils from './utils';
import * as store from './features/support/stores';

const addFundsToOrgQuery = `
  mutation addFundsToOrg($totalAmount: Int!, $CollectiveId: Int!, $HostCollectiveId: Int!, $description: String, $PaymentMethodId: Int) {
    addFundsToOrg(totalAmount: $totalAmount, CollectiveId: $CollectiveId, HostCollectiveId: $HostCollectiveId, description: $description, PaymentMethodId: $PaymentMethodId) {
      id
    }
  }
`;

describe('graphql.addFunds', () => {

  let user, collective, hostCollective;

  beforeEach(async () => {
    await utils.resetTestDB();
    ({ user } = await store.newUser('a user'));
    ({ collective, hostCollective } = await store.newCollectiveWithHost(
      'test-collective', 'USD', 'USD', 10));
  }); /* End of "before" */

  it('should create a new prepaid payment method', async () => {
    const args = {
      totalAmount: 2000,
      CollectiveId: collective.id,
      HostCollectiveId: hostCollective.id,
      description: 'test funds',
    };

    // When the funds are added
    const gqlResult = await utils.graphqlQuery(addFundsToOrgQuery, args, user);

    // Then it should be a successful call
    gqlResult.errors && console.error(gqlResult.errors[0]);
    expect(gqlResult.errors).to.be.empty;

    // And then there should be a new payment method created in the
    // database
    const dbResult = await models.PaymentMethod.findAll({
      where: { customerId: collective.slug }
    });

    expect(dbResult.length).to.equal(1);
    expect(dbResult[0].name).to.equal('test funds');
    expect(dbResult[0].initialBalance).to.equal(2000);
  }); /* End of "should create a new payment method" */

  it('should create only one payment method and add funds to it when there is a payment method id defined on the query parameters', async () => {
    const args = {
      totalAmount: 2000,
      CollectiveId: collective.id,
      HostCollectiveId: hostCollective.id,
      description: 'test funds',
    };

    // When the funds are added
    const gqlResult = await utils.graphqlQuery(addFundsToOrgQuery, args, user);

    // Then it should be a successful call
    gqlResult.errors && console.error(gqlResult.errors[0]);
    expect(gqlResult.errors).to.be.empty;

    // And then there should be a new payment method created in the
    // database
    let dbResult = await models.PaymentMethod.findAll({
      where: { customerId: collective.slug }
    });

    expect(dbResult.length).to.equal(1);
    expect(dbResult[0].name).to.equal('test funds');
    expect(dbResult[0].initialBalance).to.equal(2000);

    // Then create a second query to add more funds and specify
    // the payment method the funds should go to
    args.PaymentMethodId = dbResult[0].id;
    // When the funds are added twice
    const gqlResult0 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult0.errors && console.error(gqlResult0.errors[0]);

    // And then there should be a new payment method created in the
    // database
    dbResult = await models.PaymentMethod.findAll({
      where: { customerId: collective.slug }
    });

    expect(dbResult.length).to.equal(1);
    expect(dbResult[0].name).to.equal('test funds');
    expect(dbResult[0].initialBalance).to.equal(4000);

  }); /* End of "should create only one payment method and add funds to it when there is a payment method id defined on the query parameters" */

  it('should create more than one payment method when there is no PaymentMethodId defined in query parameters', async () => {
    const args = {
      totalAmount: 2000,
      CollectiveId: collective.id,
      HostCollectiveId: hostCollective.id,
      description: 'test funds',
    };

    // When the funds are added twice
    const gqlResult0 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult0.errors && console.error(gqlResult0.errors[0]);
    expect(gqlResult0.errors).to.be.empty;

    // changing some properties on the second query parameters
    args.totalAmount = 3000;
    args.description = 'second test on adding funds';

    // executing second query
    const gqlResult1 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult1.errors && console.error(gqlResult1.errors[0]);
    expect(gqlResult1.errors).to.be.empty;

    // And then there should be 2 payment methods created in the
    // database
    const dbResult = await models.PaymentMethod.findAll({
      where: { customerId: collective.slug }
    });
    expect(dbResult.length).to.equal(2);
    expect(dbResult[0].name).to.equal('test funds');
    expect(dbResult[0].initialBalance).to.equal(2000);
    expect(dbResult[1].name).to.equal('second test on adding funds');
    expect(dbResult[1].initialBalance).to.equal(3000);

  }); /* End of "should create more than one payment method when there is no PaymentMethodId defined in query parameters" */

}); /* End of "graphql.addFunds" */
