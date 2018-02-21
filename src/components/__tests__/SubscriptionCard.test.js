import React from 'react';
import Enzyme, { mount } from 'enzyme';
import { IntlProvider, addLocaleData } from 'react-intl';

import SubscriptionCard from '../SubscriptionCard';

const onSubmit = (value) => {
  console.log("> onSubmit", value);
}

describe("SubscriptionCard.test.js", () => {

 const mountComponent = (props) => mount(
        <IntlProvider locale="en">
          <SubscriptionCard {...props} />
        </IntlProvider>
    );

  const defaultValues = {
    slug: 'userSlug',
    paymentMethods: [],
    subscription: {
      interval: 'month',
      totalAmount: 1000,
      currency: 'USD',
      isSubscriptionActive: true,
      collective: {
        backgroundImage: null,
        slug: 'collectiveSlug'
      }
    }
  }

  it('doesn\'t display actions when not logged in', () => {

    const values = Object.assign({}, defaultValues, { paymentMethodInUse: {}});
    const component = mountComponent(values);

    expect(component.find('.actions').length).toEqual(0);
  });

  // TODO: skipping these tests to get subscriptions out in time
  it.skip('displays actions when logged in for this user', () => {

  })

  it.skip('displays past-due status when subscription is past-due', () => {

  });

  it.skip('displays cancel buttons when Cancel Contribution is selected', () => {

  });

  it.skip('reverts back to normal state when Cancel action is canceled', () => {

  });

  it.skip('displays paymentmethod options when Update Payment Method is selected', () => {

  });

})
