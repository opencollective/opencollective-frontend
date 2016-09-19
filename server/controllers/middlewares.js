import async from 'async';
import {appendTier, paginateOffset} from '../lib/utils';
import Promise from 'bluebird';
import json2csv from 'json2csv';
import moment from 'moment';
import _ from 'lodash';
import * as users from '../controllers/users';
import queries from '../lib/queries';
import models from '../models';
import errors from '../lib/errors';

const {
  Application,
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
 * Check the api_key.
 */
export const apiKey = (req, res, next) => {
  const key = req.query.api_key || req.body.api_key;

  if (!key) return next();

  Application.findByKey(key).tap(application => {
    if (!application) {
      return next(new errors.Unauthorized(`Invalid API key: ${key}`));
    }

    if (application.disabled) {
      return next(new errors.Forbidden('Application disabled'));
    }

    req.application = application;

    next();
  })
  .catch(next);
};

/**
 * Authenticate.
 * @PRE: Need to submit a login (username or email)/password as a POST request.
 *       api_key is also required
 * @POST: req.remoteUser and req.user are set to the logged in user
 */
export const authenticate = (req, res, next) => {
  const username = (req.body && req.body.username) || req.query.username;
  const email = (req.body && req.body.email) || req.query.email;
  const password = (req.body && req.body.password) || req.query.password;
  if (!req.application || !req.application.api_key) {
    return next();
  }

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
    req.user = req.remoteUser;

    next();
  });
};

/**
 * Identify User and Application from the jwtoken.
 *
 *  Use the req.remoteUser._id (from the access_token) to get the
 *    full user's model
 *  Use the req.remoteUser.audience (from the access_token) to get the
 *    full application's model
 */
export const identifyFromToken = (req, res, next) => {
  if (!req.jwtPayload || !req.jwtPayload.sub) {
    return next();
  }
  async.parallel([
    function(cb) {
      User
        .findById(req.jwtPayload.sub)
        .tap((user) => {
          req.remoteUser = user;
          cb();
        })
        .catch(cb);
    },
    function(cb) {
      const appId = parseInt(req.jwtPayload.aud);

      // Check the validity of the application in the token.
      Application
        .findById(appId)
        .tap((application) => {
          if (!application || application.disabled)
            return cb(new errors.Unauthorized('Invalid API key.'));

          req.application = application;
          cb();
        })
        .catch(next);
    }

  ], next);

};

/**
 * Either a user or an Application has to be authenticated.
 */
export const authorizeAuthUserOrApp = (req, res, next) => {
  if (!req.remoteUser && !req.application) {
    return next(new errors.Unauthorized('Unauthorized'));
  }

  next();
};

/**
 * Authorize to get the group.
 */
export const authorizeGroup = (req, res, next) => {
  if (!req.group) {
    return next(new errors.NotFound());
  }

  const checkUserAccess = () => {
    if (!req.remoteUser) {
      return Promise.resolve(false);
    }
    return req.group.hasUser(req.remoteUser.id);
  };

  const checkAppAccess = () => {
    if (!req.application) {
      return Promise.resolve();
    }

    return req.group.hasApplication(req.application);
  };

  Promise.reduce([checkUserAccess(), checkAppAccess()], (total, auth) => total || auth)
    .tap(hasAccess => {
      if (!hasAccess) {
        return next(new errors.Forbidden('Unauthorized'));
      }
      next();
    })
    .catch(next);
};

/**
 * Fetch user roles for the group
 */
export const fetchRoles = (req, res, next) => {
  if (!req.remoteUser) return next();

  req.remoteUser.getRoles()
    .then(roles => {
      const rolesByGroupId = {};
      roles.map(r => {
        rolesByGroupId[r.GroupId] = rolesByGroupId[r.GroupId] || [];
        rolesByGroupId[r.GroupId].push(r.role);
      });
      return rolesByGroupId;
    })
    .then(rolesByGroupId => {
      req.remoteUser.rolesByGroupId = rolesByGroupId; 
    })
    .then(() => next())
    .catch(next);
};

/**
 * Authorize if group is public
 */
export const authorizeIfGroupPublic = (req, res, next) => {
  if (req.group && req.group.isPublic) {
    return next('route'); // bypass the callbacks
  }

  return next();
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

export const checkJWTExpiration = (req, res, next) => {
  if (req.jwtExpired) {
    return next(new errors.CustomError(401, 'jwt_expired', 'jwt expired'));
  }

  return next();
};
