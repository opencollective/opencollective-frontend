var bodyParser = require('body-parser');

module.exports = function(app) {

  // Body parser.
  app.use(bodyParser.json());

}

