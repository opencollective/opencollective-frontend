module.exports = imageUrlToAmazonUrl;
var path = require('path');
var uuid = require('node-uuid');
var mime = require('mime');
var request = require('request');

/**
* Takes an external image URL and returns a Amazon S3 URL with the 
* same file.
*
* @param knox_client {Client} Knox `Client` instance e.g `app.knox`
* @param src {String}
* @param callback {Function}
* 		@param error {Error|null}
* 		@param aws_src {String}
*/
function imageUrlToAmazonUrl(knox_client, src, callback)
{
	var options = {url: src, method: 'HEAD'};
	request(options, (error, response) => {
		if (error) return callback(error)
		var contentLength = response.headers['content-length'];
		var contentType = response.headers['content-type'];
		if (contentLength)
		{
			var name = path.basename(src).replace(/\W/g, ''); // remove non alphanumeric
			var ext = mime.extension(contentType) || path.extname(src).substr(1);
			var filename = `/${name}_${uuid.v1()}.${ext}`;

			var put = knox_client.put(filename, {
				'Content-Length': contentLength,
				'Content-Type': contentType,
				'x-amz-acl': 'public-read'
			});

			request.get(src).on('response', (response) => response.pipe(put));

			put.on('response', (response) => {
				if (response.statusCode === 200)
				{
					setImmediate(callback, (put.url) ? null : new Error('Upload Failed - s3 URL was not created'), put.url);
				}
				else
				{
					callback(new Error(`AWS Upload Failed - ${response.statusCode} ${response.statusMessage}`));
				}
			});
		}
		else
		{
			callback(new Error('Not found - missing header: Content-Length'));
		}
	});
}
