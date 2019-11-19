import { intersection, get, uniqBy } from 'lodash';

class LoggedInUser {
  constructor(data) {
    Object.assign(this, data);
    if (this.memberOf) {
      const roles = {};
      this.memberOf.map(member => {
        if (!member.collective) return;
        roles[member.collective.slug] = roles[member.collective.slug] || [];
        roles[member.collective.slug].push(member.role);
      });
      this.roles = roles;
    }
  }
}

/**
 * hasRole if LoggedInUser has one of the roles for the given collective
 */
LoggedInUser.prototype.hasRole = function(roles, collective) {
  if (typeof roles === 'string') roles = [roles];
  return intersection(this.roles[collective.slug], roles).length > 0;
};

/**
 * CanEditCollective if LoggedInUser is
 * - creator of the collective
 * - is admin or host of the collective
 */
LoggedInUser.prototype.canEditCollective = function(collective) {
  if (!collective) return false;
  if (collective.type === 'EVENT') return this.canEditEvent(collective);
  return (
    collective.id === this.CollectiveId ||
    get(collective, 'createdByUser.id') === this.id ||
    intersection(this.roles[collective.slug], ['HOST', 'ADMIN']).length > 0
  );
};

/**
 * CanEditComment if LoggedInUser is
 * - creator of the comment
 * - is admin or host of the collective
 */
LoggedInUser.prototype.canEditComment = function(comment) {
  if (!comment) return false;
  return (
    get(comment, 'createdByUser.id') === this.id ||
    intersection(this.roles[get(comment, 'collective.slug')], ['HOST', 'ADMIN']).length > 0 ||
    intersection(this.roles[get(comment, 'collective.host.slug')], ['ADMIN']).length > 0
  );
};

/**
 * CanEditEventif LoggedInUser is
 * - creator of the event
 * - is admin of the event
 * - is admin of the parent collective
 */
LoggedInUser.prototype.canEditEvent = function(eventCollective) {
  if (!eventCollective) return false;
  if (eventCollective.type !== 'EVENT') {
    console.error(`LoggedInUser.canEditEvent: ${eventCollective.slug} is not of type EVENT`);
    return false;
  }
  return (
    get(eventCollective, 'createdByUser.id') === this.id ||
    intersection(this.roles[eventCollective.slug], ['ADMIN']).length > 0 ||
    intersection(this.roles[get(eventCollective, 'parentCollective.slug')], ['ADMIN']).length > 0
  );
};

/**
 * CanApproveExpense if LoggedInUser is:
 * - admin or host of expense.collective
 * - admin or host of expense.collective.host
 */
LoggedInUser.prototype.canApproveExpense = function(expense) {
  if (!expense) return false;
  if (expense.collective) {
    if (intersection(this.roles[expense.collective.slug], ['HOST', 'ADMIN']).length > 0) return true;
    const hostSlug = get(expense, 'collective.host.slug');
    if (intersection(this.roles[hostSlug], ['HOST', 'ADMIN']).length > 0) return true;
  }
  return false;
};

/**
 * CanEditExpense if not paid yet and LoggedInUser is:
 * - author of the expense and expense.status === 'PENDING' or 'APPROVED'
 * - can approve expense (admin or host of expense.collective or expense.collective.host)
 */
LoggedInUser.prototype.canEditExpense = function(expense) {
  if (!expense) return false;
  if (expense.status === 'PAID') return false;
  if (
    (expense.status === 'PENDING' || expense.status === 'APPROVED') &&
    expense.fromCollective &&
    expense.fromCollective.id === this.collective.id
  )
    return true;
  return this.canApproveExpense(expense);
};

LoggedInUser.prototype.canEditUpdate = function(update) {
  if (!update) return false;
  if (get(update, 'createdByUser.id') === this.id) return true; // if author
  if (this.canEditCollective(update.fromCollective)) return true; // if admin of collective author
  if (this.canEditCollective(update.collective)) return true; // if admin of collective
  if (intersection(this.roles[get(update, 'collective.slug')], ['ADMIN']).length > 0) return true;
  return false;
};

/**
 * CanPayExpense if LoggedInUser is HOST or ADMIN of the HOST of the collective
 */
LoggedInUser.prototype.canPayExpense = function(expense) {
  const hostSlug = get(expense, 'collective.host.slug');
  // second part of if statement is a hack, in case this User's Collective is the Host
  if (intersection(this.roles[hostSlug], ['HOST', 'ADMIN']).length > 0 || this.collective.slug === hostSlug) {
    return true;
  }
  return false;
};

/**
 * canEditSubscription if LoggedInUser is ADMIN of the collective
 */
LoggedInUser.prototype.canEditSubscription = function(order) {
  if (!order) return false;
  if (
    (this.roles[order.fromCollective.slug] && this.roles[order.fromCollective.slug].includes('ADMIN')) ||
    (order.fromCollective.createdByUser && order.fromCollective.createdByUser.id === this.id)
  ) {
    return true;
  }
  return false;
};

LoggedInUser.prototype.isRoot = function() {
  return intersection(this.roles['opencollective'], ['ADMIN']).length > 0;
};

LoggedInUser.prototype.hostsUserIsAdminOf = function() {
  // List all the hosts this user belongs to and is admin of
  return uniqBy(
    this.memberOf
      .filter(m => m.collective.isHost)
      .filter(m => this.hasRole(['ADMIN'], m.collective))
      .map(m => m.collective),
    'id',
  );
};

LoggedInUser.prototype.isHostAdmin = function(collective) {
  return collective.host && intersection(this.roles[collective.host.slug], ['ADMIN']).length > 0;
};

export default LoggedInUser;
