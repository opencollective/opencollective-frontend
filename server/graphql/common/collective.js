/**
 * Resolver function for host field on Collective type.
 */

async function hostResolver(collective, _, { loaders }) {
  let hostCollective = null;
  if (collective.HostCollectiveId) {
    hostCollective = await loaders.Collective.byId.load(collective.HostCollectiveId);
    // Get the host collective from the parent collective.
  } else if (collective.ParentCollectiveId) {
    const parentCollective = await loaders.Collective.byId.load(collective.ParentCollectiveId);
    if (parentCollective && parentCollective.HostCollectiveId) {
      hostCollective = await loaders.Collective.byId.load(parentCollective.HostCollectiveId);
    }
  }
  return hostCollective;
}

export { hostResolver };
