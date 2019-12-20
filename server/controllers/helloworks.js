import { get } from 'lodash';
import config from 'config';
import HelloWorks from 'helloworks-sdk';
import s3 from '../lib/awsS3';
import models from '../models';
import fs from 'fs';
import logger from '../lib/logger';
import { encrypt } from '../lib/encryption';

const { User, LegalDocument, RequiredLegalDocument } = models;
const {
  requestStatus: { ERROR, RECEIVED },
} = LegalDocument;
const {
  documentType: { US_TAX_FORM },
} = RequiredLegalDocument;

const HELLO_WORKS_KEY = get(config, 'helloworks.key');
const HELLO_WORKS_SECRET = get(config, 'helloworks.secret');
const HELLO_WORKS_WORKFLOW_ID = get(config, 'helloworks.workflowId');

const HELLO_WORKS_S3_BUCKET = get(config, 'helloworks.aws.s3.bucket');
const ENCRYPTION_KEY = get(config, 'helloworks.documentEncryptionKey');

function processMetadata(metadata) {
  // Check if metadata is malformed
  // ie: {"email,a@example.com":"1","userId,258567":"0","year,2019":"2"}
  const metadataNeedsFix = Math.max(...Object.values(metadata).map(value => value.length)) === 1;
  if (!metadataNeedsFix) {
    return metadata;
  }

  return Object.keys(metadata).reduce((acc, string) => {
    const [key, value] = string.split(',');
    acc[key] = value;
    return acc;
  }, {});
}

async function callback(req, res) {
  logger.info('Tax Form callback (raw):', req.rawBody);
  logger.info('Tax Form callback (parsed):', req.body);

  const client = new HelloWorks({
    apiKeyId: HELLO_WORKS_KEY,
    apiKeySecret: HELLO_WORKS_SECRET,
  });

  const {
    body: { status, workflow_id: workflowId, data, id, metadata: metadataReceived },
  } = req;

  const metadata = processMetadata(metadataReceived);

  if (status && status === 'completed' && workflowId == HELLO_WORKS_WORKFLOW_ID) {
    const { userId, email, year } = metadata;
    const documentId = Object.keys(data)[0];

    logger.info('Completed Tax form. Metadata:', metadata);

    let user;
    if (userId) {
      user = await User.findOne({ where: { id: userId } });
    } else if (email) {
      user = await User.findOne({ where: { email } });
    }
    if (!user) {
      logger.error('Tax Form: could not find user matching metadata', metadata);
      res.sendStatus(400);
    }

    const userCollectiveName = await user.username;

    const doc = await LegalDocument.findByTypeYearUser({ year, documentType: US_TAX_FORM, user });

    client.workflowInstances
      .getInstanceDocument({
        instanceId: id,
        documentId,
      })
      .then(buff => Promise.resolve(encrypt(buff, ENCRYPTION_KEY)))
      .then(UploadToS3({ id: userCollectiveName, year, documentType: US_TAX_FORM }))
      .then(({ Location: location }) => {
        doc.requestStatus = RECEIVED;
        doc.documentLink = location;
        return doc.save();
      })
      .then(() => res.sendStatus(200))
      .catch(err => {
        doc.requestStatus = ERROR;
        doc.save();
        logger.error('error saving tax form: ', err);
        res.sendStatus(400);
      });
  } else {
    res.sendStatus(200);
  }
}

function UploadToS3({ id, year, documentType }) {
  return function uploadToS3(buffer) {
    const bucket = HELLO_WORKS_S3_BUCKET;
    const key = createTaxFormFilename({ id, year, documentType });

    if (!s3) {
      // s3 may not be set in a dev env
      logger.error('s3 is not set, saving file to temp folder. This should only be done in development');
      saveFileToTempStorage({ filename: key, buffer });
      return Promise.resolve({ Location: key });
    }

    return new Promise((resolve, reject) => {
      s3.upload({ Body: buffer, Bucket: bucket, Key: key }, (err, data) => {
        if (err) {
          logger.error('error uploading file to s3: ', err);
          reject();
        } else {
          resolve(data);
        }
      });
    });
  };
}

function saveFileToTempStorage({ buffer, filename }) {
  fs.writeFile(`/tmp/${filename}`, buffer, logger.info);
}

function createTaxFormFilename({ id, year, documentType }) {
  return `${documentType}_${year}_${id}.pdf`;
}

export default {
  callback,
};
