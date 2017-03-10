import path from 'path';
import uuid from 'node-uuid';
import mime from 'mime';
import request from 'request';
import MultiPartUpload from 'knox-mpu-alt';

/**
* Takes an external image URL and returns a Amazon S3 URL with the
* same file.
*
* @param knox_client {Client} Knox `Client` instance e.g `app.knox`
* @param src {String}
* @param callback {Function}
*     @param error {Error|null}
*     @param aws_src {String}
*/
function imageUrlToAmazonUrl(knox_client, src, callback) {
  request.head(src, (error, response) => {
    if (error) {
      return callback(error);
    }
    const contentType = response.headers['content-type'];
    if (response.statusCode === 200) {
      const name = path.basename(src).replace(/\W/g, ''); // remove non alphanumeric
      const ext = mime.extension(contentType) || path.extname(src).substr(1);
      const filename = `/${name}_${uuid.v1()}.${ext}`;

    this.multiPartUpload({
        client: knox_client,
        objectName: filename,
        stream: request.get(src),
        headers: {
          'Content-Type': contentType,
          'x-amz-acl': 'public-read'
        }
      }, (err, body) => err ? callback(err) : callback(null, body.Location));
    } else {
      callback(new Error('Image not found'));
    }
  });
}

// separate function to make stubbing easier.
function multiPartUpload(object, callback) {
   new MultiPartUpload(object, callback);
}

export default {
  imageUrlToAmazonUrl,
  multiPartUpload
}