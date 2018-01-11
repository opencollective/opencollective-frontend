import { intersection, get } from 'lodash';

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
 * CanEditCollective if LoggedInUser is
 * - creator of the collective
 * - is admin or host of the collective
 */
LoggedInUser.prototype.canEditCollective = function(collective) {
  if (!collective) return false;
  return (collective.createdByUser && collective.createdByUser.id === this.id) 
  || intersection(this.roles[collective.slug], ['HOST','ADMIN']).length > 0;
}

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
}

/**
 * CanEditExpense if not paid yet and LoggedInUser is:
 * - author of the expense and expense.status === 'PENDING'
 * - can approve expense (admin or host of expense.collective or expense.collective.host)
 */
LoggedInUser.prototype.canEditExpense = function(expense) {
  if (!expense) return false;
  if (expense.status === 'PAID') return false;
  if ( expense.status === 'PENDING' && expense.fromCollective && expense.fromCollective.id === this.collective.id) return true;
  return this.canApproveExpense(expense);
}

/**
 * CanPayExpense if LoggedInUser is HOST or ADMIN of the HOST of the collective
 */
LoggedInUser.prototype.canPayExpense = function(expense) {
  const hostSlug = get(expense, 'collective.host.slug');
  // second part of if statement is a hack, in case this User's Collective is the Host
  if ((intersection(this.roles[hostSlug], ['HOST', 'ADMIN']).length > 0)
    || (this.collective.slug === hostSlug)) {
    return true;
  }
  return false;                  
}

LoggedInUser.prototype.isRoot = function() {
  return intersection(this.roles['opencollectiveinc_internal'], ['ADMIN']).length > 0;
}

export default LoggedInUser;