import DataLoader from 'dataloader';

/**
 * To check if remoteUser has access to user's data. Similar feature than `getPersonalDetails`,
 * except it's safe to use in batches.
 */
export const generateCanSeeUserPrivateInfoLoader = (req): DataLoader<number, boolean> => {
  return new DataLoader(async (users: any[]) => {
    const remoteUser = req.remoteUser;
    if (!remoteUser) {
      return users.map(() => false);
    }

    await remoteUser.populateRoles();
    const remoteUserMemberships = Object.keys(remoteUser.rolesByCollectiveId);
    const adminOfCollectives = remoteUserMemberships.filter(CollectiveId => remoteUser.isAdmin(CollectiveId));
    return Promise.all(
      users.map(async user => {
        if (remoteUser.id === user.id) {
          return true;
        } else {
          await user.populateRoles();
          const memberOfCollectives = Object.keys(user.rolesByCollectiveId);
          return adminOfCollectives.some(collectiveId => memberOfCollectives.includes(collectiveId));
        }
      }),
    );
  });
};
