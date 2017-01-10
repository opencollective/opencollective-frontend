import React from 'react';
import ReactDOM from 'react-dom';
import SignInUp from './SignInUp';

const onSubmit = (value) => {
  console.log("> onSubmit", value);
}

describe("Interested", () => {

  const div = document.createElement('div');
  const component = ReactDOM.render(
    <SignInUp
      emailOnly={true}
      label='Remind me'
      showLabels={false}
      onSubmit={onSubmit}
      />, div);

  it('only shows the email field', () => {
    expect(Object.keys(component.refs)).toEqual(['email']);
  });

  it('validates the email address', () => {
    component.handleChange('email', 'xx');
    expect(component.state.valid).toEqual(undefined);
    component.handleChange('email', 'xx@xx.com');
    expect(component.state.valid).toEqual(true);
    component.refs.email.value = 'xa';
  });
})

describe("Register for free", () => {

  const div = document.createElement('div');
  const component = ReactDOM.render(
    <SignInUp
      requireCreditCard={false}
      onSubmit={onSubmit}
      />, div);

  it('only shows the email field', () => {
    expect(Object.keys(component.refs)).toEqual([ 'email', 'firstname', 'lastname', 'description', 'twitter' ]);
  });

})


describe("Register with credit card", () => {

  const div = document.createElement('div');
  const component = ReactDOM.render(
    <SignInUp
      requireCreditCard={true}
      label='sign up'
      onSubmit={onSubmit}
      />, div);

  it('renders the credit card form', () => {
    expect(div.querySelector('.CreditCardForm').nodeName).toEqual('DIV');
  });

})
