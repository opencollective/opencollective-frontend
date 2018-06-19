import { expect } from 'chai';
import { describe, it } from 'mocha';
import models from '../server/models';

import * as utils from './utils';

describe('graphql.allCollectives.test.js', () => {
  let hostAdmin, publicHost, privateHost, collective1, collective2, user1;

  before('reset test db', () => utils.resetTestDB());
  before('build up db content', async () => {
    hostAdmin = await models.User.createUserWithCollective({ email: "admin@host.com" });
    user1 = await models.User.createUserWithCollective({ email: "user1@gmail.com" });
    privateHost = user1.collective;
    publicHost = await models.Collective.create({ name: "BrusselsTogether ASBL", settings: { apply: { title: "apply" } }});
    privateHost = await models.Collective.create({ name: "Xavier"  });
    await publicHost.addUserWithRole(hostAdmin, "ADMIN");
    collective1 = await models.Collective.create({ name: "VeganBrussels" });
    await collective1.addHost(publicHost, user1);
    collective2 = await models.Collective.create({ name: "Personal Collective" });
    await collective2.addHost(privateHost, user1);
    await publicHost.createConnectedAccount({
      service: "stripe"
    });
    await privateHost.createConnectedAccount({
      service: "stripe"
    });
  });


  describe("hosts", () => {

    const allCollectivesQuery = `
    query allCollectives($isPublicHost: Boolean) {
      allCollectives(isPublicHost: $isPublicHost) {
        total
        collectives {
          id
          type
          slug
          settings
          canApply
        }
      }
    }
    `;

    it('gets all the hosts where we can apply', async () => {
      const result = await utils.graphqlQuery(allCollectivesQuery, { isPublicHost: true });
      result.errors && console.error(result.errors);
      expect(result.errors).to.not.exist;
      const { allCollectives } = result.data;
      const hosts = allCollectives.collectives;
      expect(hosts).to.have.length(1);
      expect(hosts[0].slug).to.equal("brusselstogether-asbl");
      expect(hosts[0].canApply).to.be.true;
    });

  });

});
