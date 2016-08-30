const app = require('../server/index');
const config = require('config');
const imageUrlToAmazonUrl = require('../server/lib/imageUrlToAmazonUrl');
const expect = require('chai').expect;
const sinon = require('sinon');

const SAMPLE = 'https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/1dca3d82-9c91-4d2a-8fc9-4a565c531764'

describe('lib.imageUrlToAmazonUrl.js', () => {
  describe('#Convert an external image url to a Amazon url', () => {

    before(() => {
      sinon.stub(app.knox, 'put', () => {
        const s = new require('stream').Readable();
        s.write = function(){}
        s.end = function(){
          s.url = `https://${config.aws.s3.bucket}.s3-us-west-1.amazonaws.com/31654v3_2ba16cc0-124d-11e6-b36a-2d79eed36137.png`
          s.emit('response', {statusCode: 200, statusMessage: 'OK'})
        }
        return s
      });
    });

    after(() => {
      app.knox.put.restore()
    })

    it('successfully converts cloudfront.net url to amazon aws url', done => {
      imageUrlToAmazonUrl(
        app.knox,
        SAMPLE,
        (e, aws_src) => {
          expect(e).to.not.exist;
          expect(aws_src).to.contain('.amazonaws.com/');
          expect(aws_src).to.contain(config.aws.s3.bucket);
          done();
        }
      );
    });
  });
});
