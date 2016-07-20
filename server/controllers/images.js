/**
 * Dependencies.
 */

const fs = require('fs');
const path = require('path');
const uuid = require('node-uuid');

/**
 * Controller.
 */

module.exports = function(app) {
  const errors = app.errors;

  const upload = function(req, res, next) {
    const file = req.files.file;

    if (!file) {
      return next(new errors.ValidationFailed('missing_required', {
        file: 'File field is required and missing'
      }));
    }

    /**
     * We will replace the name to avoid collisions
     */

    const ext = path.extname(file.originalname);
    const filename = ['/', uuid.v1(), ext].join('');

    const put = app.knox.put(filename, {
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
