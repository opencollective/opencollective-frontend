var _ = require('lodash');

module.exports = function(app) {

  /**
   * Internal Dependencies.
   */
  var models = app.set('models');

  /**
   * Get the cards of the user.
   *
   * We use the method to know if the user need to confirm her/his paypal
   * account
   */
  var getCards = function(req, res, next) {
    var filter = req.query.filter;
    var query = _.extend({}, filter, { UserId: req.user.id });

    return models.Card.findAll({ where: query })
    .then(function(response) {
      res.send(_.pluck(response, 'info'));
    });
  };

  /**
   * Public methods.
   */
  return {
    getCards: getCards
  };
};
