import { expect } from 'chai';

/* Support code */
import models from '../server/models';

/* Test tools */
import * as utils from './utils';
import * as store from './stores';

const addFundsToOrgQuery = `
  mutation addFundsToOrg($totalAmount: Int!, $CollectiveId: Int!, $HostCollectiveId: Int!, $description: String) {
    addFundsToOrg(totalAmount: $totalAmount, CollectiveId: $CollectiveId, HostCollectiveId: $HostCollectiveId, description: $description) {
      id
    }
  }
`;

describe('graphql.addFunds', () => {
  let user, collective, hostCollective;

  beforeEach(async () => {
    await utils.resetTestDB();
    ({ user } = await store.newUser('a user'));
    ({ collective, hostCollective } = await store.newCollectiveWithHost('test-collective', 'USD', 'USD', 10));
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
    expect(gqlResult.errors).to.be.undefined;

    // And then there should be a new payment method created in the
    // database
    const dbResult = await models.PaymentMethod.findAll({
      where: { customerId: collective.slug },
    });

    expect(dbResult.length).to.equal(1);
    expect(dbResult[0].name).to.equal('test funds');
    expect(dbResult[0].initialBalance).to.equal(2000);
  }); /* End of "should create a new payment method" */

  it('should always create a new prepaid payment method when adding funds', async () => {
    const args = {
      totalAmount: 2000,
      CollectiveId: collective.id,
      HostCollectiveId: hostCollective.id,
      description: 'test funds',
    };

    // When the funds are added twice
    const gqlResult0 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult0.errors && console.error(gqlResult0.errors[0]);
    expect(gqlResult0.errors).to.be.undefined;

    // changing some properties on the second query parameters
    args.totalAmount = 3000;
    args.description = 'second test on adding funds';

    // executing second query
    const gqlResult1 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult1.errors && console.error(gqlResult1.errors[0]);
    expect(gqlResult1.errors).to.be.undefined;

    // changing some properties on the second query parameters
    args.totalAmount = 4000;
    args.description = 'third test on adding funds';

    // executing second query
    const gqlResult2 = await utils.graphqlQuery(addFundsToOrgQuery, args, user);
    gqlResult2.errors && console.error(gqlResult2.errors[0]);
    expect(gqlResult2.errors).to.be.undefined;

    // And then there should be 2 payment methods created in the
    // database
    const dbResult = await models.PaymentMethod.findAll({
      where: { customerId: collective.slug },
    });
    expect(dbResult.length).to.equal(3);
    expect(dbResult[0].name).to.equal('test funds');
    expect(dbResult[0].initialBalance).to.equal(2000);
    expect(dbResult[0].monthlyLimitPerMember).to.be.null;
    expect(dbResult[1].name).to.equal('second test on adding funds');
    expect(dbResult[1].initialBalance).to.equal(3000);
    expect(dbResult[1].monthlyLimitPerMember).to.be.null;
    expect(dbResult[2].name).to.equal('third test on adding funds');
    expect(dbResult[2].initialBalance).to.equal(4000);
    expect(dbResult[2].monthlyLimitPerMember).to.be.null;
  }); /* End of "should always create a new prepaid payment method when adding funds" */
}); /* End of "graphql.addFunds" */
