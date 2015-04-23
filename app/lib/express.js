var bodyParser = require('body-parser');
var cors = require('cors');
var multer = require('multer');

module.exports = function(app) {

  // Body parser.
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer());

  // Cors.
  app.use(cors());

}

