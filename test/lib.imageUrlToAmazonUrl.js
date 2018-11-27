import imageUrlLib from '../server/lib/imageUrlToAmazonUrl';
import { expect } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import knox from 'knox';
import uuid from 'uuid';
import stream from 'stream';

import amazonMockData from './mocks/amazon';

const imageUrl = 'https://d1ts43dypk8bqh.cloudfront.net/v1/images/1dca3d82-9c91-4d2a-8fc9-4a565c531764';
const returnUrl =
  'https://opencollective-test.s3-us-west-1.amazonaws.com/31654v3_2ba16cc0-124d-11e6-b36a-2d79eed36137.png';

describe('lib.imageUrlToAmazonUrl.js', () => {
  /* Need to jump through some hoops to stub updated uuid library */
  describe('#Convert an external image url to a Amazon url', () => {
    const nocks = {};
    let multiPartStub;

    before(() => {
      sinon.stub(uuid, 'v1').callsFake(() => 'testuuid');

      multiPartStub = sinon.stub(imageUrlLib, 'multiPartUpload');
      multiPartStub.yields(null, { Location: returnUrl });
    });

    beforeEach(() => {
      const s = stream.Readable();
      s.read = () => null;
      s.write = function() {};
      s.end = function() {
        s.emit('response', { statusCode: 200, statusMessage: 'OK' });
      };
      nocks['cloudfront.get'] = nock(imageUrl)
        .get('')
        .reply(200, s);
    });

    after(() => {
      uuid.v1.restore();
    });

    it('returns an error if the image url is not found', done => {
      nocks['cloudfront.head'] = nock(imageUrl)
        .head('')
        .reply(404);

      imageUrlLib.imageUrlToAmazonUrl(knox, imageUrl, e => {
        expect(e.toString()).to.include('Image not found');
        done();
      });
    });

    it('successfully converts cloudfront.net url to amazon aws url', done => {
      nocks['cloudfront.head'] = nock(imageUrl)
        .head('')
        .reply(200, amazonMockData.cloudfront.head, {
          'Content-Type': 'image/png',
        });

      imageUrlLib.imageUrlToAmazonUrl(knox, imageUrl, (e, aws_src) => {
        expect(e).to.not.exist;
        expect(multiPartStub.callCount).to.equal(1);
        expect(multiPartStub.firstCall.args[0].objectName).to.equal('/1dca3d829c914d2a8fc94a565c531764_testuuid.png');
        expect(multiPartStub.firstCall.args[0].headers).to.deep.equal({
          'Content-Type': 'image/png',
          'x-amz-acl': 'public-read',
          'Cache-Control': `max-age=${60 * 60 * 24 * 30}`,
        });
        expect(aws_src).to.equal(returnUrl);
        done();
      });
    });
  });
});
