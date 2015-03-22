var config = require('config');

module.exports = function(app) {

  var errors = app.errors;

  return {

    /**
     *  Parameters required for a route.
     */
    required: function(properties) {
      properties = [].slice.call(arguments);

      return function(req, res, next) {
        var missing = {};
        req.required = {};

        properties.forEach(function(prop) {
          var value = req.params[prop];
          if (!value && value !== false)
            value = req.headers[prop];
          if (!value && value !== false)
            value = req.body[prop];
          
          if ( (!value || value === 'null') && value !== false ) {
            missing[prop] = 'Required field ' + prop + ' missing';
          } else {
            try { // Try to parse if JSON
              value = JSON.parse(value);
            } catch(e) {}
            req.required[prop] = value;
          }
        });
        
        if (Object.keys(missing).length) {
          return next(new errors.ValidationFailed('missing_required', missing));
        }
        
        next();
      };
    },

    /**
     * Check the api_key.
     */
    apiKey: function(req, res, next) {
      var key = req.required['api_key'];

      if (key !== config.application.api_key)
        return next(new errors.Unauthorized('Invalid API key.'));

      next();
    },

    /**
     * Authenticate.
     */
    authenticate: function(req, res, next) {
      var username = req.params['username']
        , phone    = req.params['phone']
        , email    = req.params['email']
        , password = req.params['password']
        ;

      if (!req.application || !req.application.api_key) {
        return next();
      }

      if ( !(username || phone || email) || !password ) {
        return next();
      }

      User.auth(req.application.api_key, (username || email || phone), password, function(e, user) {
        if (e) return next();
        req.remoteUser = user;
        next();
      });
    },

    /**
     * Authenticate with a refresh token.
     */
    authenticateRefreshToken: function(req, res, next) {
      var accessToken = req.required.access_token
        , refreshToken = req.required.refresh_token
        ;

      // Decode access token to identify the user.
      jwt.verify(accessToken, secret, function(e) {
        if (e && e.name !== 'TokenExpiredError') // Ok if a old token.
          return next(new errors.Unauthorized('Invalid Token'));

        var decoded = jwt.decode(accessToken);
        User.findOne({_id: decoded.sub}, function(e, user) {
          if (e) 
            return next(e);
          else if (!user || user.tokens.refresh_token !== refreshToken) // Check the refresh_token from the user data.
            return next(new errors.Unauthorized('Invalid Refresh Token'));
          else {
            req.remoteUser = user;
            next();
          }
        });
      });
    },

    /**
     * Identify User and Application from the jwtoken.
     *
     *  Use the req.remoteUser._id (from the access_token) to get the full user's model
     *  Use the req.remoteUser.audience (from the access_token) to get the full application's model
     */
    identifyFromToken: function(req, res, next) {
      if (!req.remoteUser)
        return next();

      var app_id = req.remoteUser.aud;

      async.parallel([
        function(cb) {
          User.findOne({_id: req.remoteUser._id}, function(e, user) {
            if (e) return cb(e);
            req.remoteUser = user;
            cb();
          });
        },
        function(cb) {
          Application.findOne({_id: app_id}, function(e, application) {
            if (e) return cb(e);
            if (application && application.disabled)
              return next(new errors.Forbidden('Invalid API key.'));
            req.application = application;
            cb();
          });
        }
      ], next);

      
    },


    /**
     * Authorize: the user has to be authenticated.
     */
    authorize: function(req, res, next) {
      if (!req.remoteUser) {
        return next(new errors.Unauthorized('Unauthorized'));
      }
      next();
    },

    /**
     * Authorize User: same user referenced that the authenticated user.
     */
    authorizeUser: function(req, res, next) {
      if (!req.remoteUser || !req.user || (req.remoteUser.id !== req.user.id && req.remoteUser._access == 0)) {
        return next(new errors.Unauthorized('Unauthorized'));
      }
      next();
    },

  }

};
