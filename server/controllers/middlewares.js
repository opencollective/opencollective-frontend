import {appendTier, paginateOffset} from '../lib/utils';
import json2csv from 'json2csv';
import moment from 'moment';
import _ from 'lodash';
import * as users from '../controllers/users';
import queries from '../lib/queries';
import models from '../models';
import errors from '../lib/errors';
import required from '../middleware/required_param';

const {
  User
} = models;

/**
 * Fetch backers of a group by tier
 */
export const fetchUsers = (req, res, next) => {
  queries.getUsersFromGroupWithTotalDonations(req.group.id)
    .then(users => appendTier(users, req.group.tiers))
    .then(users => {
      req.users = users;
    })
    .then(next)
    .catch(next);
};

/**
 * Add this middleware before the controller (before calling res.send)
 * `format` should be 'csv'
 */
export const format = (format) => {

  return (req, res, next) => {

    switch (format) {
      case 'csv': {
        const {send} = res;
        res.send = (data) => {
          data = _.map(data, (row) => {
            if (row.createdAt)
              row.createdAt = moment(row.createdAt).format("YYYY-MM-DD HH:mm");

            return row;
          });
          const fields = (data.length > 0) ? Object.keys(data[0]) : [];
          json2csv({data, fields }, (err, csv) => {
            res.setHeader('content-type', 'text/csv');
            send.call(res, csv);
          });
        }
        return next();
      }
      default:
        return next();
    }

  }

};

/**
 * Use the logged in user or create a new user
 * Returns an error if not logged in and a user already exists for the email address provided
 * Used for creating a comment
 */
export const authOrCreateUser = (req, res, next) => {
  // If already logged in, proceed
  if (req.remoteUser) {
    req.user = req.remoteUser;
    return next();
  }
  required('user')(req, res, (e) => {
    if (e) return next(e);
    User.findOne({
      where: {
        email: req.required.user.email.toLowerCase()
      }
    })
    .then(user => {
      if (user) throw new errors.Unauthorized("A user already exists with that email address. Please login first");
      else return users._create(req.body.user);
    })
    .tap(user => req.user = user)
    .tap(() => next())
    .catch(next);
  });
}

/**
 * Get the user based on its email or paypalEmail. If not found, creates one.
 * Used for creating a transaction from a new/returning donor or an expense from a new/returning user.
 */
export const getOrCreateUser = (req, res, next) => {

  // If already logged in, proceed
  if (req.remoteUser) {
    req.user = req.remoteUser;
    return next();
  }

  let name, email, paypalEmail;

  // TODO remove #postmigration, replaced by req.body.expense
  if (req.body.transaction) {
    ({ email } = req.body.transaction);
    ({ paypalEmail } = req.body.transaction);
    ({ name } = req.body.transaction);
  } else if (req.body.expense) {
    ({ email } = req.body.expense);
    ({ paypalEmail } = req.body.expense);
    ({ name } = req.body.expense);
  } else if (req.body.user) {
    ({ name } = req.body.user);
    ({ email } = req.body.user);
  } else if (req.body.payment) {
    // TODO remove #postmigration
    ({ email } = req.body.payment);
  }

  const password = req.body.password || req.query.password;

  if (!email && !paypalEmail) {
    return next(new errors.ValidationFailed("Email or paypalEmail required"));
  }

  if (password) {
    return this.authenticate(req, res, next);
  }

  if (email) {
    email = email.toLowerCase();
  }
  if (paypalEmail) {
    paypalEmail = paypalEmail.toLowerCase();
  }

  const userData = {
    name,
    email: email || paypalEmail,
    paypalEmail
  };

  User.findOne({
    where: {
      $or: {
        email: userData.email,
        paypalEmail: userData.paypalEmail
      }
    }
  })
  .then(user => user || users._create(userData))
  .tap(user => req.user = user)
  .tap(() => next())
  .catch(next);

};

/**
 * Authenticate.
 * @PRE: Need to submit a login (username or email)/password as a POST request.
 * @POST: req.remoteUser is set to the logged in user
 */
export const authenticate = (req, res, next) => {
  const username = (req.body && req.body.username) || req.query.username;
  const email = (req.body && req.body.email) || req.query.email;
  const password = (req.body && req.body.password) || req.query.password;

  if (!(username || email) || !password) {
    return next();
  }

  User.auth((username || email), password, (e, user) => {

    const errorMsg = 'Invalid username/email or password';

    if (e) {
      if (e.code === 400) {
        return next(new errors.BadRequest(errorMsg));
      } else {
        return next(new errors.ServerError(e.message));
      }
    }

    if (!user) {
      return next(new errors.BadRequest(errorMsg));
    }

    req.remoteUser = user;

    next();
  });
};

/**
 * Paginate.
 */
export const paginate = (options) => {
  options = options || {};

  options = {
    default: options.default || 20,
    min: options.min || 1,
    max: options.max || 50,
    maxTotal: options.maxTotal || false
  };

  return function(req, res, next) {

    // Since ID.
    const sinceId = req.body.since_id || req.query.since_id;
    if (sinceId) {
      req.pagination = {
        where: {
          id: {$gt: sinceId}
        }
      };
      return next();
    }

    // Page / Per_page.
    let perPage = (req.body.per_page || req.query.per_page);
    perPage = perPage * 1 || options.default;
    let page = (req.body.page || req.query.page) * 1 || 1;

    page = (page < 1) ? 1 : page;
    perPage = (perPage < options.min) ? options.min : perPage;
    perPage = (perPage > options.max) ? options.max : perPage;

    req.pagination = paginateOffset(page, perPage);

    next();
  };
};

/**
 * Sorting.
 */
export const sorting = (options) => {
  options = options || {};

  options.key = (typeof options.key !== 'undefined') ? options.key : 'id';
  options.dir = (typeof options.dir !== 'undefined') ? options.dir : 'ASC';

  return function(req, res, next) {
    const key = req.body.sort || req.query.sort;
    const dir = req.body.direction || req.query.direction;

    req.sorting = {
      key: key || options.key,
      dir: (dir || options.dir).toUpperCase()
    };

    next();
  };
};