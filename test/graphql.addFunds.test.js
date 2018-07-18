import { expect } from 'chai';

/* Support code */
import models from '../server/models';

/* Test tools */
import * as utils from './utils';
import * as store from './features/support/stores';


const addFundsToOrgQuery = `
  mutation addFundsToOrg($totalAmount: Int!, $collectiveId: Int!, $hostCollectiveId: Int!, $description: String) {
    addFundsToOrg(totalAmount: $totalAmount, collectiveId: $collectiveId, hostCollectiveId: $hostCollectiveId, description: $description) {
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
      collectiveId: collective.id,
      hostCollectiveId: hostCollective.id,
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

  it('should not create more than one payment method per host/organization', async () => {
    const args = {
      totalAmount: 2000,
      collectiveId: collective.id,
      hostCollectiveId: hostCollective.id,
      description: 'test funds',
    };

    // When the funds are added twice
    const gqlResult0 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult0.errors && console.error(gqlResult0.errors[0]);
    expect(gqlResult0.errors).to.be.empty;
    const gqlResult1 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult1.errors && console.error(gqlResult1.errors[0]);
    expect(gqlResult1.errors).to.be.empty;

    // And then there should be a new payment method created in the
    // database
    const dbResult = await models.PaymentMethod.findAll({
      where: { customerId: collective.slug }
    });

    expect(dbResult.length).to.equal(1);
    expect(dbResult[0].name).to.equal('test funds');
    expect(dbResult[0].initialBalance).to.equal(4000);

  }); /* End of "should not create more than one payment method per host/organization" */

}); /* End of "graphql.addFunds" */
