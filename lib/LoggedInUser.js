import { get, uniqBy } from 'lodash';
import { CollectiveType } from './constants/collectives';
import ROLES from './constants/roles';
import EXPENSE_STATUS from './constants/expense-status';

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
LoggedInUser.prototype.hasRole = function(roles, collective) {
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
 * - creator of the collective
 * - is admin or host of the collective
 */
LoggedInUser.prototype.canEditCollective = function(collective) {
  if (!collective) {
    return false;
  } else if (collective.type === CollectiveType.EVENT) {
    return this.canEditEvent(collective);
  } else {
    return (
      collective.id === this.CollectiveId ||
      get(collective, 'createdByUser.id') === this.id ||
      this.hasRole([ROLES.HOST, ROLES.ADMIN], collective)
    );
  }
};

/**
 * CanEditComment if LoggedInUser is
 * - creator of the comment
 * - is admin or host of the collective
 */
LoggedInUser.prototype.canEditComment = function(comment) {
  if (!comment) {
    return false;
  }

  return (
    get(comment, 'createdByUser.id') === this.id ||
    this.hasRole([ROLES.HOST, ROLES.ADMIN], comment.collective) ||
    this.isHostAdmin(comment.collective) ||
    this.isSelf(comment.fromCollective)
  );
};

/**
 * Returns true if passed collective is the user collective
 */
LoggedInUser.prototype.isSelf = function(collective) {
  if (!collective || !collective.id) {
    return false;
  } else {
    return collective.id === this.CollectiveId;
  }
};

/**
 * CanEditEventif LoggedInUser is
 * - creator of the event
 * - is admin of the event
 * - is admin of the parent collective
 */
LoggedInUser.prototype.canEditEvent = function(eventCollective) {
  if (!eventCollective) {
    return false;
  } else if (eventCollective.type !== CollectiveType.EVENT) {
    console.error(`LoggedInUser.canEditEvent: ${eventCollective.slug} is not of type EVENT`);
    return false;
  }

  return (
    get(eventCollective, 'createdByUser.id') === this.id ||
    this.hasRole(ROLES.ADMIN, eventCollective) ||
    this.hasRole(ROLES.ADMIN, eventCollective.parentCollective)
  );
};

/**
 * CanApproveExpense if LoggedInUser is:
 * - admin or host of expense.collective
 * - admin or host of expense.collective.host
 */
LoggedInUser.prototype.canApproveExpense = function(expense) {
  if (!expense) {
    return false;
  } else {
    return this.hasRole([ROLES.HOST, ROLES.ADMIN], expense.collective) || this.isHostAdmin(expense.collective);
  }
};

/**
 * CanEditExpense if not paid yet and LoggedInUser is:
 * - author of the expense and expense.status === 'PENDING' or 'APPROVED'
 * - can approve expense (admin or host of expense.collective or expense.collective.host)
 */
LoggedInUser.prototype.canEditExpense = function(expense) {
  // Can't edit paid expenses
  if (!expense || expense.status === EXPENSE_STATUS.PAID) {
    return false;
  }

  // Users can only edit their expenses if approved or pending
  if (expense.fromCollective) {
    const statusesUserCanEdit = [EXPENSE_STATUS.APPROVED, EXPENSE_STATUS.PENDING];
    if (expense.fromCollective.id === this.collective.id && statusesUserCanEdit.includes(expense.status)) {
      return true;
    }
  }

  return this.canApproveExpense(expense);
};

/**
 * Returns true if user can edit this update
 */
LoggedInUser.prototype.canEditUpdate = function(update) {
  if (!update) {
    return false;
  } else if (update.createdByUser && update.createdByUser.id === this.id) {
    return true; // if author
  } else if (this.canEditCollective(update.fromCollective)) {
    return true; // if admin of collective author
  } else if (this.canEditCollective(update.collective)) {
    this.canEditCollective(update.collective); // if admin of collective
  }
};

/**
 * CanPayExpense if LoggedInUser is HOST or ADMIN of the HOST of the collective
 */
LoggedInUser.prototype.canPayExpense = function(expense) {
  return this.isHostAdmin(expense.collective);
};

/**
 * canEditSubscription if LoggedInUser is ADMIN of the collective
 */
LoggedInUser.prototype.canEditSubscription = function(order) {
  if (!order) {
    return false;
  } else if (order.fromCollective) {
    if (this.hasRole(ROLES.ADMIN, order.fromCollective)) {
      return true;
    } else if (order.fromCollective.createdByUser) {
      return order.fromCollective.createdByUser.id === this.id;
    }
  }

  return false;
};

/**
 * Returns true if user is root
 */
LoggedInUser.prototype.isRoot = function() {
  return this.roles['opencollective'] ? this.roles['opencollective'].includes(ROLES.ADMIN) : false;
};

/**
 * List all the hosts this user belongs to and is admin of
 */
LoggedInUser.prototype.hostsUserIsAdminOf = function() {
  const collectives = this.memberOf
    .filter(m => m.collective.isHost)
    .filter(m => this.hasRole(ROLES.ADMIN, m.collective))
    .map(m => m.collective);

  return uniqBy(collectives, 'id');
};

LoggedInUser.prototype.isHostAdmin = function(collective) {
  if (!collective || !collective.host) {
    return false;
  } else {
    return this.hasRole(ROLES.ADMIN, collective.host) || this.hasRole(ROLES.HOST, collective);
  }
};

export default LoggedInUser;
