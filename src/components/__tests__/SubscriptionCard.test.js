import React from 'react';
import SubscriptionCard from '../SubscriptionCard';
import { shallowWithIntl } from '../../../test/intlHelper';

const onSubmit = (value) => {
  console.log("> onSubmit", value);
}

describe("PaymentMethodChooser.test.js", () => {

  const component = shallowWithIntl(
      <SubscriptionCard
        LoggedInUser={}
        slug={}
        subscription={}
        paymentMethods={}
        />
  ).dive();

  it('only displays paymentmethod and actions when logged in', () => {

  });

  it('displays past-due status when subscription is past-due', () => {

  });

  it('displays cancel buttons when Cancel Contribution is selected', () => {

  });

  it('reverts back to normal state when Cancel action is canceled', () => {

  });

  it('displays paymentmethod options when Update Payment Method is selected', () => {

  });

})
