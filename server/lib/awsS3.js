import S3 from 'aws-sdk/clients/s3';
import config from 'config';

// Create S3 service object & set credentials and region
let s3;
if (config.aws.s3.key) {
  s3 = new S3({
    accessKeyId: config.aws.s3.key,
    secretAccessKey: config.aws.s3.secret,
    apiVersion: '2006-03-01',
    region: 'us-west-1',
  });
}
export default s3;
