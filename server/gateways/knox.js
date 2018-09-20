import knox from 'knox';
import config from 'config';

// S3 bucket
let knoxClient;
if (config.aws.s3.key) {
  knoxClient = knox.createClient({
    key: config.aws.s3.key,
    secret: config.aws.s3.secret,
    bucket: config.aws.s3.bucket,
    region: 'us-west-1',
  });
}

export default knoxClient;
