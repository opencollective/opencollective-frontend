/**
 * Dependencies.
 */

var fs = require('fs');
var path = require('path');
var uuid = require('node-uuid');

/**
 * Controller.
 */

module.exports = function(app) {
  var errors = app.errors;

  var upload = function(req, res, next) {
    var file = req.files.file;

    if (!file) {
      return next(new errors.ValidationFailed('missing_required', {
        file: 'File field is required and missing'
      }));
    }

    /**
     * We will replace the name to avoid collisions
     */

    var ext = path.extname(file.originalname);
    var name = file.originalname.replace(/\W/g, ''); // remove non alphanumeric
    var filename = ['/', name, '_', uuid.v1(), ext].join('');

    var put = app.knox.put(filename, {
      'Content-Length': file.size,
      'Content-Type': file.mimetype,
      'x-amz-acl': 'public-read'
    });

    fs.createReadStream(file.path).pipe(put);

    put.on('response', (response) => {
      res.send({
        status: response.statusCode,
        url: put.url
      });
    });
  };

  /**
   * Public methods.
   */

  return {
    upload
  };

};
