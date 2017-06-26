import React from 'react';
import SignInUp from '../SignInUp';
import { shallowWithIntl } from '../../../test/intlHelper';

const onSubmit = (value) => {
  console.log("> onSubmit", value);
}

describe("Interested", () => {

  const component = shallowWithIntl(
      <SignInUp
        emailOnly={true}
        label='Remind me'
        showLabels={false}
        onSubmit={onSubmit}
        />
  ).dive();

  it('only shows the email field', () => {
    expect(component.find('input').length).toEqual(1);
  });

  it('updates the email address', () => {
    component.instance().handleChange('email', 'xx@xx.com');
    expect(component.state("user").email).toEqual('xx@xx.com');
  });
})

describe("Register for free", () => {

  const component = shallowWithIntl(
      <SignInUp
        requireCreditCard={false}
        onSubmit={onSubmit}
        />
  ).dive();

  it('only shows the email field', () => {
    expect(component.find('input').map(c => c.node.ref)).toEqual([ 'email', 'firstName', 'lastName', 'description', 'twitterHandle' ]);
    expect(component.find('input').length).toEqual(5); // [ 'email', 'firstname', 'lastname', 'description', 'twitter' ]
  });

})

describe("Register with credit card", () => {

  const component = shallowWithIntl(
      <SignInUp
        requireCreditCard={true}
        label='sign up'
        onSubmit={onSubmit}
        />
  ).dive();

  it('renders the credit card form', () => {
    expect(component.find('.CreditCardForm').exists()).toBeTrue;
  });

})
