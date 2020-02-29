import path from 'path';
import { v1 as uuid } from 'uuid';
import config from 'config';

import errors from '../lib/errors';
import s3 from '../lib/awsS3';

// Use a 2 minutes timeout for image upload requests as the default 25 seconds
// often leads to failing requests.
const IMAGE_UPLOAD_TIMEOUT = 2 * 60 * 1000;

export default function uploadImage(req, res, next) {
  const file = req.file;

  if (!file) {
    return next(
      new errors.ValidationFailed('missing_required', {
        file: 'File field is required and missing',
      }),
    );
  }

  if (!file.mimetype || !(file.mimetype.match(/image\/.*/i) || file.mimetype.match(/application\/pdf/i))) {
    return next(
      new errors.ValidationFailed('invalid mimetype', {
        file: 'Mimetype of the file should be image/png, image/jpeg or application/pdf',
      }),
    );
  }

  if (file.size > 1024 * 1024 * 10) {
    return next(
      new errors.ValidationFailed('invalid filesize', {
        file: 'Filesize cannot exceed 10MB',
      }),
    );
  }

  if (!s3) {
    return next(new errors.ServerError('S3 service object not initialized'));
  }

  /**
   * We will replace the name to avoid collisions
   */
  const ext = path.extname(file.originalname);
  const filename = [uuid(), ext].join('');

  const uploadParams = {
    Bucket: config.aws.s3.bucket,
    Key: filename,
    Body: file.buffer,
    ACL: 'public-read',
    ContentLength: file.size,
    ContentType: file.mimetype,
  };

  req.setTimeout(IMAGE_UPLOAD_TIMEOUT);

  // call S3 to retrieve upload file to specified bucket
  s3.upload(uploadParams, (err, data) => {
    if (err) {
      return next(new errors.ServerError(`Error: ${err}`));
    }
    if (data) {
      res.send({
        status: 200,
        url: data.Location,
      });
    }
  });
}
