import fs from 'fs';
import path from 'path';
import uuid from 'uuid';
import errors from '../lib/errors';
import knox from '../gateways/knox';

export default function uploadImage(req, res, next) {
  const { file } = req.files;

  if (!file) {
    return next(new errors.ValidationFailed('missing_required', {
      file: 'File field is required and missing'
    }));
  }

  if (!file.mimetype || !(file.mimetype.match(/image\/.*/i) || file.mimetype.match(/application\/pdf/i))) {
    return next(new errors.ValidationFailed('invalid mimetype', {
      file: 'Mimetype of the file should be image/png, image/jpeg or application/pdf'
    }))
  }

  if (file.size > 1024 * 1024 * 10) {
    return next(new errors.ValidationFailed('invalid filesize', {
      file: 'Filesize cannot exceed 10MB'
    }))
  }

  if (!knox) {
    return next(new errors.ServerError('AWS Knox client not initialized'));
  }

  /**
   * We will replace the name to avoid collisions
   */
  const ext = path.extname(file.originalname);
  const filename = ['/', uuid.v1(), ext].join('');

  const put = knox.put(filename, {
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
}
