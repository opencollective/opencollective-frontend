/**
 * Controller.
 */
module.exports = function(app) {

  const models = app.set('models');
  const queries = require('../lib/queries')(models.sequelize);

  return (req, res, next) => {
  	queries.getGroupsByTag(['open source'], 10, [], 0, false)
    .then(results => {
    	const di = {
    		collectives: results
    	};
    	res.send(di);
    })
    .catch(next)
  }
};