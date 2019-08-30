import sinon from 'sinon';
import nodemailer from 'nodemailer';
import { expect } from 'chai';
import emailLib from '../server/lib/email';
import * as utils from '../test/utils';
import config from 'config';

const emailData = utils.data('emailData');

describe('lib/email', () => {
  let nm;

  // create a fake nodemailer transport
  beforeEach(done => {
    config.mailgun.user = 'xxxxx';
    config.mailgun.password = 'password';

    nm = nodemailer.createTransport({
      name: 'testsend',
      service: 'Mailgun',
      sendMail(data, callback) {
        callback();
      },
      logger: false,
    });
    sinon.stub(nodemailer, 'createTransport').callsFake(() => {
      return nm;
    });
    done();
  });

  // stub the transport
  beforeEach(done => {
    sinon.stub(nm, 'sendMail').callsFake((object, cb) => {
      cb(null, object);
    });
    done();
  });

  afterEach(done => {
    nm.sendMail.restore();
    done();
  });

  afterEach(() => {
    config.mailgun.user = '';
    config.mailgun.password = '';
    nodemailer.createTransport.restore();
  });

  it('sends the thankyou.fr email template', () => {
    const template = 'thankyou';
    const collective = { name: 'En Marche', slug: 'enmarchebe' };
    const data = {
      order: { totalAmount: 5000, currency: 'EUR' },
      transaction: { uuid: '17811b3e-0ac4-4101-81d4-86e9e0aefd7b' },
      config: { host: config.host },
      interval: 'month',
      firstPayment: false,
      user: emailData.user,
      fromCollective: { id: 1, slug: 'xdamman', name: 'Xavier' },
      collective,
    };
    const options = {
      from: `${collective.name} <hello@${collective.slug}.opencollective.com>`,
    };
    return emailLib.send(template, data.user.email, data, options).tap(() => {
      let amountStr = 50;
      amountStr = amountStr.toLocaleString('fr-BE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      expect(nm.sendMail.lastCall.args[0].from).to.equal(options.from);
      expect(nm.sendMail.lastCall.args[0].to).to.equal('emailbcc+user1-at-opencollective.com@opencollective.com');
      expect(nm.sendMail.lastCall.args[0].subject).to.contain(
        `Merci pour votre donation de ${amountStr}/mois à En Marche`,
      );
      expect(nm.sendMail.lastCall.args[0].html).to.contain('Merci pour continuer à nous soutenir');
      expect(nm.sendMail.lastCall.args[0].html).to.contain('donate');
      expect(nm.sendMail.lastCall.args[0].headers['X-Mailgun-Tag']).to.equal('internal');
    });
  });

  it('sends the thankyou.wwcode email template', () => {
    const paymentData = {
      totalAmount: 5000,
      currency: 'USD',
    };

    const data = {
      order: paymentData,
      transaction: { uuid: '17811b3e-0ac4-4101-81d4-86e9e0aefd7b' },
      config: { host: config.host },
      interval: 'month',
      user: emailData.user,
      collective: {
        name: 'WWCode Austin',
        slug: 'wwcodeaustin',
      },
    };
    return emailLib.send('thankyou', data.user.email, data).tap(() => {
      let amountStr = 50;
      amountStr = amountStr.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      expect(nm.sendMail.lastCall.args[0].to).to.equal('emailbcc+user1-at-opencollective.com@opencollective.com');
      expect(nm.sendMail.lastCall.args[0].subject).to.contain(
        `Thank you for your ${amountStr}/month donation to WWCode Austin`,
      );
      expect(nm.sendMail.lastCall.args[0].html).to.contain('4218859');
    });
  });

  it('sends the thankyou.brusselstogether email template', () => {
    const paymentData = {
      totalAmount: 5000,
      currency: 'EUR',
    };

    const data = {
      order: paymentData,
      transaction: { uuid: '17811b3e-0ac4-4101-81d4-86e9e0aefd7b' },
      config: { host: config.host },
      interval: 'month',
      user: emailData.user,
      collective: {
        name: '#BrusselsTogether',
        slug: 'brusselstogether',
        image: 'https://cl.ly/0Q3N193Z1e3u/BrusselsTogetherLogo.png',
      },
      relatedCollectives: utils.data('relatedCollectives'),
    };
    const from = 'BrusselsTogether <info@brusselstogether.opencollective.com>';
    return emailLib.send('thankyou', data.user.email, data, { from }).tap(() => {
      let amountStr = 50;
      amountStr = amountStr.toLocaleString('EUR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

      expect(nm.sendMail.lastCall.args[0].from).to.equal(from);
      expect(nm.sendMail.lastCall.args[0].to).to.equal('emailbcc+user1-at-opencollective.com@opencollective.com');
      expect(nm.sendMail.lastCall.args[0].subject).to.contain(
        `Thank you for your ${amountStr}/month donation to #BrusselsTogether`,
      );
      expect(nm.sendMail.lastCall.args[0].html).to.contain(data.relatedCollectives[0].name);
      expect(nm.sendMail.lastCall.args[0].html).to.contain(
        `${config.host.invoices}/${data.collective.slug}/transactions/${data.transaction.uuid}/invoice.pdf`,
      );
    });
  });
});
