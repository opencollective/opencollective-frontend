import { get, uniqBy } from 'lodash';

import { CollectiveType } from './constants/collectives';
import ROLES from './constants/roles';

/**
 * Represent the current logged in user. Includes methods to check permissions.
 */
class LoggedInUser {
  constructor(data) {
    Object.assign(this, data);
    if (this.memberOf) {
      // Build a map of roles like { [collectiveSlug]: [ADMIN, BACKER...] }
      this.roles = this.memberOf.reduce((roles, member) => {
        if (member.collective) {
          roles[member.collective.slug] = roles[member.collective.slug] || [];
          roles[member.collective.slug].push(member.role);
        }

        return roles;
      }, {});
    }
  }
}

/**
 * hasRole if LoggedInUser has one of the roles for the given collective
 */
LoggedInUser.prototype.hasRole = function (roles, collective) {
  if (!collective || !this.roles[collective.slug]) {
    return false;
  } else if (typeof roles === 'string') {
    return this.roles[collective.slug].includes(roles);
  } else {
    return this.roles[collective.slug].some(role => roles.includes(role));
  }
};

/**
 * CanEditCollective if LoggedInUser is
 * - its own USER collective
 * - is admin of the collective
 * - is host of the collective
 */
LoggedInUser.prototype.isAdminOfCollectiveOrHost = function (collective) {
  if (!collective) {
    return false;
  } else if (collective.type === CollectiveType.EVENT) {
    return this.canEditEvent(collective);
  } else if (collective.type === CollectiveType.PROJECT) {
    return this.canEditProject(collective);
  } else {
    return (
      collective.id === this.CollectiveId ||
      collective.slug === get(this, 'collective.slug') ||
      this.hasRole([ROLES.HOST, ROLES.ADMIN], collective) ||
      this.isHostAdmin(collective)
    );
  }
};

/**
 * Has access to admin panel if admin or accountant
 */
LoggedInUser.prototype.canSeeAdminPanel = function (collective) {
  return this.hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT], collective);
};

/**
 * CanEditComment if LoggedInUser is
 * - creator of the comment
 * - is admin or host of the collective
 */
LoggedInUser.prototype.canEditComment = function (comment) {
  if (!comment) {
    return false;
  }

  return (
    this.hasRole([ROLES.HOST, ROLES.ADMIN], comment.collective) ||
    this.isHostAdmin(comment.collective) ||
    this.isSelf(comment.fromCollective) ||
    this.canEditEvent(comment.collective)
  );
};

/**
 * Returns true if passed collective is the user collective
 */
LoggedInUser.prototype.isSelf = function (collective) {
  if (!collective || !collective.id) {
    return false;
  } else {
    return collective.id === this.CollectiveId || collective.slug === this.collective.slug;
  }
};

/**
 * CanEditEvent if LoggedInUser is
 * - admin of the event
 * - admin of the parent collective
 */
LoggedInUser.prototype.canEditEvent = function (event) {
  if (!event) {
    return false;
  } else if (event.type !== CollectiveType.EVENT) {
    return false;
  }

  const parent = event.parentCollective || event.parent;
  return this.hasRole(ROLES.ADMIN, parent) || this.hasRole(ROLES.ADMIN, event);
};

/**
 * CanEditProject if LoggedInUser is
 * - admin of the project
 * - admin of the parent collective
 */
LoggedInUser.prototype.canEditProject = function (project) {
  if (!project) {
    return false;
  } else if (project.type !== CollectiveType.PROJECT) {
    return false;
  }

  const parent = project.parentCollective || project.parent;
  return this.hasRole(ROLES.ADMIN, parent) || this.hasRole(ROLES.ADMIN, project);
};

/**
 * Returns true if user can edit this update
 */
LoggedInUser.prototype.canEditUpdate = function (update) {
  if (!update) {
    return false;
  } else if (this.isAdminOfCollectiveOrHost(update.fromAccount)) {
    return true; // if admin of collective author
  } else if (this.isAdminOfCollectiveOrHost(update.account)) {
    return true;
  }
};

/**
 * Returns true if user is root
 */
LoggedInUser.prototype.isRoot = function () {
  return this.roles['opencollective'] ? this.roles['opencollective'].includes(ROLES.ADMIN) : false;
};

/**
 * List all the hosts this user belongs to and is admin of
 */
LoggedInUser.prototype.hostsUserIsAdminOf = function () {
  const collectives = this.memberOf
    .filter(m => m.collective.isHost)
    .filter(m => this.hasRole(ROLES.ADMIN, m.collective))
    .map(m => m.collective);

  return uniqBy(collectives, 'id');
};

LoggedInUser.prototype.isHostAdmin = function (collective) {
  if (!collective || !collective.host) {
    return false;
  } else {
    return this.hasRole(ROLES.ADMIN, collective.host) || this.hasRole(ROLES.HOST, collective);
  }
};

export default LoggedInUser;
