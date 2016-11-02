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
          sendMail (data, callback) {
              callback();
          },
          logger: false
        });
    sinon.stub(nodemailer, 'createTransport', () => {
      return nm;
    });
    done();
  });

  // stub the transport
  beforeEach(done => {
    sinon.stub(nm, 'sendMail', (object, cb) => {
      cb(null, object);
    });
    done();
  });

  afterEach(done => {
    nm.sendMail.restore();
    done();
  })

  afterEach(() => {
    config.mailgun.user = '';
    config.mailgun.password = '';
    nodemailer.createTransport.restore();
  });


  it('sends the thankyou.fr email template', () => {
    const paymentData = {
      amount: 5000,
      currency: 'EUR'
     };

    const data = {
      donation: paymentData,
      interval: 'month',
      user: emailData.user,
      group: {
        name: "La Primaire",
        slug: "laprimaire"
      },
      config
    };

    return emailLib.send('thankyou', data.user.email, data)
      .tap(() => {
        expect(nm.sendMail.lastCall.args[0].to).to.equal(data.user.email);
        expect(nm.sendMail.lastCall.args[0].subject).to.contain('Merci pour votre donation de €50.00/mois à La Primaire');
      });
  });

  it('sends the thankyou.wwcode email template', () => {

    const paymentData = {
      amount: 5000,
      currency: 'USD'
     };

    const data = {
      donation: paymentData,
      interval: 'month',
      user: emailData.user,
      group: {
        name: "WWCode Austin",
        slug: "wwcodeaustin"
      },
      config
    };

    return emailLib.send('thankyou', data.user.email, data)
      .tap(() => {
        expect(nm.sendMail.lastCall.args[0].to).to.equal(data.user.email);
        expect(nm.sendMail.lastCall.args[0].subject).to.contain('Thank you for your $50.00/month donation to WWCode Austin');
        expect(nm.sendMail.lastCall.args[0].html).to.contain('4218859');
      });
  });

  it('sends the thankyou.brusselstogether email template', () => {

    const paymentData = {
      amount: 5000,
      currency: 'EUR'
     };

    const data = {
      donation: paymentData,
      interval: 'month',
      user: emailData.user,
      group: {
        name: '#BrusselsTogether',
        slug: 'brusselstogether',
        logo: 'https://cl.ly/0Q3N193Z1e3u/BrusselsTogetherLogo.png'
      },
      relatedGroups: [
        {
          name: 'Reinventing Brussels',
          slug: 'reinventingbrussels',
          description: 'Co-creating the City of our Dreams',
          logo: 'https://cl.ly/0Q3N193Z1e3u/BrusselsTogetherLogo.png',
          currency: 'EUR',
          contributorsCount: 3,
          yearlyIncome: 1020
        },
        {
          name: 'Refugees Got Talent',
          slug: 'refugeesgottalent',
          description: 'We offer a space and artistic material to refugees artists, so they can practice their art again.',
          logo: 'https://cl.ly/0Q3N193Z1e3u/BrusselsTogetherLogo.png',
          currency: 'EUR',
          contributorsCount: 20,
          yearlyIncome: 5000
        },
        {
          name: 'Brussels Smart City',
          slug: 'brusselssmartcity',
          description: 'Connect people to create value, one project at a time.',
          logo: 'https://cl.ly/0Q3N193Z1e3u/BrusselsTogetherLogo.png',
          currency: 'EUR',
          contributorsCount: 2,
          yearlyIncome: 100
        }
      ],
      config
    };

    return emailLib.send('thankyou', data.user.email, data)
      .tap(() => {
        expect(nm.sendMail.lastCall.args[0].to).to.equal(data.user.email);
        expect(nm.sendMail.lastCall.args[0].subject).to.contain('Thank you for your €50.00/month donation to #BrusselsTogether');
        expect(nm.sendMail.lastCall.args[0].html).to.contain(data.relatedGroups[0].name);
      });
  });

});
