import path from 'path';
import { readFileSync } from 'fs-extra';
import { expect } from 'chai';
import { sequelize } from '../../server/models';
import { fakeUser, fakeCollective, fakeEvent, fakeUpdate } from '../test-helpers/fake-data';

const banCollectivesQuery = readFileSync(path.join(__dirname, '../../sql/ban-collectives.sql'), 'utf8');

const createCollectiveWithData = async () => {
  const user = await fakeUser();
  const collective = await fakeCollective();
  const collectiveAdminMember = await collective.addUserWithRole(user, 'ADMIN');
  const event = await fakeEvent({ ParentCollectiveId: collective.id });
  const eventAdminMember = await event.addUserWithRole(user, 'ADMIN');
  const updates = await Promise.all([
    // User-submitted update on collective
    fakeUpdate({ CollectiveId: collective.id, CreatedByUserId: user.id, FromCollectiveId: user.collective.id }),
    // Someone's else update on collective
    fakeUpdate({ CollectiveId: collective.id }),
    // User-submitted update on another collective
    fakeUpdate({ CreatedByUserId: user.id, FromCollectiveId: user.collective.id }),
  ]);

  return {
    user,
    collective,
    event,
    updates: {
      byUserOnCollective: updates[0],
      bySomeoneElseOnCollective: updates[1],
      byUserOnAnotherCollective: updates[2],
    },
    members: {
      collective: collectiveAdminMember,
      event: eventAdminMember,
    },
  };
};

/**
 * Ensure that the proper data gets deleted. Still left to check:
 *   - delete comments
 *   - delete tiers
 *   - delete connected accounts
 *   - delete conversations
 *   - delete expenses
 *   - delete applications
 *   - delete orders
 *   - delete notifications
 */
describe('sql/ban-collectives', () => {
  before(async () => {
    // Create some data to make sure tests are not deleting more than they should
    createCollectiveWithData();
    createCollectiveWithData();
    createCollectiveWithData();
  });

  it('deletes all data from the collective when banned', async () => {
    const { user, collective, event, updates, members } = await createCollectiveWithData();
    const [result] = await sequelize.query(banCollectivesQuery, {
      bind: { collectiveSlugs: [collective.slug] },
      type: sequelize.QueryTypes.SELECT,
    });

    expect(result).to.deep.eqInAnyOrder({
      deleted_profiles_ids: [collective.id, event.id],
      nb_deleted_profiles: 2,
      deleted_users: 0,
      nb_deleted_tiers: 0,
      nb_deleted_members: 2,
      nb_deleted_updates: 2,
      nb_deleted_payment_methods: 2,
      nb_deleted_connected_accounts: 0,
      nb_deleted_conversations: 0,
      nb_deleted_conversation_followers: 0,
      nb_deleted_comments: 0,
      nb_deleted_expenses: 0,
      nb_deleted_applications: 0,
      nb_deleted_orders: 0,
      nb_deleted_notifications: 0,
      nb_deleted_users: 0,
    });

    // User/user-data should not be deleted (we banned the collective)
    await expect(user).to.not.be.softDeleted;
    await expect(collective).to.be.softDeleted;
    await expect(event).to.be.softDeleted;
    await expect(members.collective).to.be.softDeleted;
    await expect(members.event).to.be.softDeleted;
    await expect(updates.byUserOnCollective).to.be.softDeleted;
    await expect(updates.bySomeoneElseOnCollective).to.be.softDeleted;
    await expect(updates.byUserOnAnotherCollective).to.not.be.softDeleted;
  });

  it('deletes all data from the user when banned', async () => {
    const { user, collective, event, updates, members } = await createCollectiveWithData();
    const [result] = await sequelize.query(banCollectivesQuery, {
      bind: { collectiveSlugs: [user.collective.slug] },
      type: sequelize.QueryTypes.SELECT,
    });

    expect(result).to.deep.eqInAnyOrder({
      nb_deleted_profiles: 1,
      deleted_users: 1,
      nb_deleted_tiers: 0,
      nb_deleted_members: 2,
      nb_deleted_updates: 2,
      nb_deleted_payment_methods: 0,
      nb_deleted_connected_accounts: 0,
      nb_deleted_conversations: 0,
      nb_deleted_conversation_followers: 0,
      nb_deleted_comments: 0,
      nb_deleted_expenses: 0,
      nb_deleted_applications: 0,
      nb_deleted_orders: 0,
      nb_deleted_notifications: 0,
      nb_deleted_users: 1,
      deleted_profiles_ids: [user.collective.id],
    });

    await expect(user).to.be.softDeleted;
    await expect(collective).to.not.be.softDeleted;
    await expect(event).to.not.be.softDeleted;
    await expect(members.collective).to.be.softDeleted;
    await expect(members.event).to.be.softDeleted;
    await expect(updates.byUserOnCollective).to.be.softDeleted;
    await expect(updates.bySomeoneElseOnCollective).to.not.be.softDeleted;
    await expect(updates.byUserOnAnotherCollective).to.be.softDeleted;
  });
});
