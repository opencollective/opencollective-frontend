import { ApolloProvider } from 'react-apollo'
import { mount } from 'enzyme';
import React from 'react';
import OrderForm from '../OrderForm';
import sinon from 'sinon';
import * as stripe from '../../lib/stripe';
import * as api from '../../lib/api';
import { IntlProvider, addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
addLocaleData([...en]);

const getStripeToken = sinon.stub(stripe, 'getStripeToken', () => {
  return {
    token: 'xxx',
    card: {
      country: 'US',
      brand: 'VISA',
      funding: 'credit'
    }
  }
})

const checkUserExistenceStub = sinon.stub(api, 'checkUserExistence', () => Promise.resolve(false));

describe("OrderForm component", () => {

  const tiers = {
    donor: {
      name: 'donor',
      slug: 'donors',
      presets: [1000, 5000, 25000],
      currency: 'USD',
      button: 'donate'
    },
    backer: {
      name: 'backer',
      amount: 1000,
      interval: 'month'
    }
  }
  const collective = {
    host: {
      name: "host name",
      slug: "host"
    }
  }
  const order = {
    totalAmount: 1000,
    interval: 'month',
    tier: tiers.donor,
  };

  const expectValue = (component, className, value) => {
    expect(component.find(`.${className} .value`).text()).toEqual(value);
  }

  const fillValue = (component, field, value) => {
    component.find({ name: field }).simulate('change', { target: { value } });
  }

  const mountComponent = (props, queryStub) => mount(
    <ApolloProvider client={{
      query: queryStub || Promise.resolve
    }} >
      <IntlProvider locale="en">
        <OrderForm {...props} />
      </IntlProvider>
    </ApolloProvider>
  );

  let component;

  afterEach(() => {
    if (component) {
      component.unmount();
    }
  })

  describe('error messages', () => {
    it('creditcard.missing', (done) => {
      component = mountComponent({ collective, order })
      fillValue(component, 'email', 'testuser@email.com');
      setTimeout(() => {
        component.find('.submit button').simulate('click');
        expect(component.find('.result .error').text()).toEqual("Invalid credit card");
        done()
      }, 1000);
    });

    it('creditcard.error', (done) => {
      component = mountComponent({ collective, order })

      const card = {
        CCnumber: '424242424242424',
        CCname: 'Xavier Damman',
        CCexpiry: '11/22',
        CCcvc: 111
      };

      fillValue(component, 'email', 'testuser@email.com');
      for (const prop in card) {
        fillValue(component, prop, card[prop]);
      }

      setTimeout(() => {
        component.find('.submit button').simulate('click');
        expect(component.find('.result .error').text()).toEqual("Invalid credit card");
        done();
      }, 500);
    });
  })

  describe('not logged in', () => {

    it('show the user details form and credit card form', (done) => {

      const onSubmit = (order) => {
        const sanitizedCard = {
          identifier: '4242',
          brand: 'VISA',
          funding: 'credit',
          country: 'US',
          save: true,
          token: 'xxx',
          fullName: 'Xavier Damman',
          expYear: 2022,
          expMonth: 11
        };
        expect(getStripeToken.callCount).toEqual(1);
        expect(order.user).toEqual({...LoggedInUser });
        expect(order.totalAmount).toEqual(tiers.donor.presets[2]);
        done();
      }

      const LoggedInUser = {
        email: 'xavier@opencollective.com',
        firstName: 'Xavier',
        lastName: 'Damman',
        twitterHandle: 'xdamman',
        description: 'entrepreneur'
      };

      const card = {
        CCnumber: '4242424242424242',
        CCname: 'Xavier Damman',
        CCexpiry: '11/22',
        CCcvc: 111
      };

      component = mountComponent({ collective, order, onSubmit })

      expect(component.find('input[type="email"]').exists()).toBeTrue;
      for (const prop in LoggedInUser) {
        fillValue(component, prop, LoggedInUser[prop]);
      }
      fillValue(component, 'publicMessage', 'public message');

      for (const prop in card) {
        fillValue(component, prop, card[prop]);
      }
      component.find('.presetBtn').last().simulate('click');
      setTimeout(() => {
        component.find('.submit button').simulate('click');
      }, 2000);
    });
  });


  describe('logged in', () => {

    // @TODO: update this test for new OrderForm
    it.skip('let the user pick a credit card', (done) => {

      getStripeToken.reset();

      const LoggedInUser = {
        id: 1,
        email: 'xavier@opencollective.com',
        firstName: 'Xavier',
        lastName: 'Damman',
        twitterHandle: 'xdamman',
        description: 'entrepreneur',
        memberOf: [
          {
            role: 'ADMIN',
            collective: {
              id: 7,
              name: "Tipbox"
            }
          }
        ],
        collective: {
          name: "Xavier Damman",
          paymentMethods: [
            {
              uuid: '8cbb6e96-aee5-482e-a027-cf242e12a139',
              identifier: '4242',
              data: {
                brand: 'visa',
                expMonth: 12,
                expYear: 2022
              }
            }
          ]
        }
      };

      const onSubmit = (order) => {
        expect(getStripeToken.callCount).toEqual(0);
        expect(order.user).toEqual({
          id: LoggedInUser.id,
          paymentMethod: {
            save: true,
            uuid: LoggedInUser.paymentMethods[0].uuid
          }
        });
        expect(order.publicMessage).toEqual('public message');
        expect(order.totalAmount).toEqual(order.totalAmount);
        done();
      }

      component = mountComponent({ collective, order, onSubmit, LoggedInUser })
      component.setProps({ LoggedInUser });

      expect(component.find('input[type="email"]').exists()).toBeFalse;
      fillValue(component, 'publicMessage', 'public message');

      for (const prop in LoggedInUser) {
        if (prop !== 'paymentMethods' && prop !== 'id') {
          expectValue(component, prop, LoggedInUser[prop]);
        }
      }
      expect(component.find('.creditcardSelector').exists()).toBeTrue;
      expect(component.find('.creditcardSelector').html()).toContain(LoggedInUser.paymentMethods[0].identifier);
      setTimeout(() => {
        component.find('.submit button').simulate('click');
        setTimeout(() => {
          console.log(">>> result: ", component.find('.result').html());
        }, 500);
      }, 2000);
    });
  });

  describe('gift card', () => {

    it('gives invalid error', (done) => {

      component = mountComponent({ collective, order }, () => Promise.resolve({ data: null}));

      fillValue(component, 'prepaidcard', 'BB-FTC1900');

      component.find('.prepaidapply.btn').simulate('click');

      setTimeout(() => {
        expect(component.find('.inputField .prepaidcard').html()).toContain('Invalid code');
        done();
      }, 1000);
    });

    it('gives correct amount on success', (done) => {

      component = mountComponent({ collective, order }, () => Promise.resolve({ data: {
          prepaidPaymentMethod: {
            balance: 5000,
            valid: true,
            currency: 'USD'
          }
      }}));

      fillValue(component, 'prepaidcard', 'BB-FTC1900');

      component.find('.prepaidapply.btn').simulate('click');

      setTimeout(() => {
        expect(component.find('.inputField .prepaidcard').html()).toContain('Valid code. Amount available: $50.00');
        done();
      }, 1000);
    })

  });
});

