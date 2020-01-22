import { expect } from 'chai';
import { processOnBoardingTemplate } from '../../../server/lib/onboarding';
import emailLib from '../../../server/lib/email';
import sinon from 'sinon';
import models from '../../../server/models';
import * as utils from '../../utils';
import Promise from 'bluebird';

describe('server/lib/onboarding', () => {
  let admins, sandbox, emailLibSendSpy;
  before(async () => {
    await utils.resetTestDB();
    sandbox = sinon.createSandbox();
    emailLibSendSpy = sandbox.spy(emailLib, 'send');
  });

  before(async () => {
    admins = await Promise.all([
      models.User.createUserWithCollective({ name: 'test adminUser1', email: 'testadminUser1@gmail.com' }),
      models.User.createUserWithCollective({ name: 'test adminUser2', email: 'testadminUser2@gmail.com' }),
    ]);
  });

  after(() => sandbox.restore());

  it('sends onboarding after 2 days for new organizations', async () => {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 2);
    const org = await models.Collective.create({
      name: 'airbnb',
      slug: 'airbnb',
      isActive: true,
      type: 'ORGANIZATION',
      CreatedByUserId: admins[0].id,
      createdAt,
    });

    await Promise.each(admins, admin =>
      models.Member.create({
        CreatedByUserId: admins[0].id,
        CollectiveId: org.id,
        MemberCollectiveId: admin.CollectiveId,
        role: 'ADMIN',
      }),
    );

    const startsAt = new Date(createdAt);
    startsAt.setHours(0);
    await processOnBoardingTemplate('onboarding.day2', startsAt);
    expect(emailLibSendSpy.firstCall.args[3].from).to.equal('Open Collective <support@opencollective.com>');
    expect(emailLibSendSpy.callCount).to.equal(2);
    admins.map((admin, i) => {
      expect(emailLibSendSpy.args[i][0]).to.equal('onboarding.day2.organization');
      expect(emailLibSendSpy.args[i][1]).to.equal(admin.email);
      expect(emailLibSendSpy.args[i][2].unsubscribeUrl).to.contain(encodeURIComponent(admin.email));
    });
  });
});
