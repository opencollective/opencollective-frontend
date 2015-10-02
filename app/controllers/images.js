/**
 * Dependencies.
 */

var fs = require('fs');

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

    var filename = '/' + file.originalname + '_' + Date.now();

    var put = app.knox.put(filename, {
      'Content-Length': file.size,
      'Content-Type': file.mimetype,
      'x-amz-acl': 'public-read'
    });

    fs.createReadStream(file.path).pipe(put);

    put.on('response', function(response) {
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
    upload: upload
  };

};
