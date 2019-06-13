import config from 'config';
import HelloWorks from 'helloworks-sdk';
import s3 from '../lib/awsS3';

const HELLO_WORKS_KEY = config.get('helloworks.key');
const HELLO_WORKS_SECRET = config.get('helloworks.secret');
const HELLO_WORKS_WORKFLOW_ID = config.get('helloworks.workflowId');

const client = new HelloWorks({
  apiKeyId: HELLO_WORKS_KEY,
  apiKeySecret: HELLO_WORKS_SECRET,
});

export function callback(req, res) {
  console.log(req.body);
  const {
    body: { status, workflow_id: workflowId, data, id },
  } = req;

  if (status && status === 'completed' && workflowId == HELLO_WORKS_WORKFLOW_ID) {
    const documentId = Object.keys(data)[0];
    console.log(`workflowId: ${workflowId}, documentId: ${documentId}`);

    client.workflowInstances
      .getInstanceDocument({
        instanceId: id,
        documentId,
      })
      .then(buffer => {
        const bucket = 'helloworks'; // TODO
        const key = documentId; // TODO
        s3.upload({ Body: buffer, bucket, key }, (err, res) => {
          if (err) {
            console.log('error writing file: ', err);
            res.sendStatus(400);
          } else {
            res.sendStatus(200);
          }
        });
        // fs.writeFile('file.pdf', buffer, err => {
        //  if (err) {
        //    console.log('error writing file: ', err);
        //    res.sendStatus(400);
        //  } else {
        //    res.sendStatus(200);
        //  }
        // });
      })
      .catch(err => {
        console.log('error getting pdf: ', err);
        res.sendStatus(400);
      });
  } else {
    res.sendStatus(200);
  }
}
