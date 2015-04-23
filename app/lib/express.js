var bodyParser = require('body-parser');
var cors = require('cors');

module.exports = function(app) {

  // Body parser.
  app.use(bodyParser.json());

  // Cors.
  app.use(cors());

}

