import React from 'react';
import colors from '../constants/colors';
import TicketsCtlr from './TicketsCtlr';
import Button from './Button';
import _ from 'lodash';
import api from '../lib/api';
import { isValidEmail } from '../lib/utils';
import CreditCardForm from './CreditCardForm';

class SignInUp extends React.Component {

  static propTypes = {
    className: React.PropTypes.string,
    next: React.PropTypes.string,
    label: React.PropTypes.string,
    requireCreditCard: React.PropTypes.bool,
    stripePublishableKey: React.PropTypes.string,
    onClick: React.PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = { signin: true, signup: true, form: {} };
    this.api = new api();

    this.renderInputField = this.renderInputField.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.fields = [
      {
        name: 'firstname',
        label: 'First name:',
        placeholder: '',
        description: ''
      },
      {
        name: 'lastname',
        label: 'Last name:',
        placeholder: '',
        description: ''
      },
      {
        name: 'description',
        label: 'One liner:',
        placeholder: '',
        description: 'Present yourself in 60 characters or less, if you can!'
      },
      {
        name: 'twitter',
        label: 'Twitter:',
        placeholder: '@xdamman',
        description: ''
      }
    ];

  }

  async signInUp(email) {
    if (!isValidEmail(email)) return;

    this.user = await this.api.getUserByEmail(email);
    if (!this.user) {
      this.setState({ signup: true });
    }
    console.log("user: ", this.user);
  }

  handleChange(fieldname, value) {
    console.log("New value for ", fieldname, value);
    this.state.form[fieldname] = value;
    switch (fieldname) {
      case 'email':
        this.signInUp(value);
        break;
    }
  }

  renderInputField(field) {

    const debouncedHandleEvent = _.debounce(this.handleChange, 500);

    return (
      <div className="field" key={field.name} >
        <label>{field.label}</label>
        <input type="text" name="{field.name}" placeholder={field.placeholder} onChange={(event) => debouncedHandleEvent(field.name, event.target.value)} />
        <span className="description">{field.description}</span>
      </div>          
    );
  }

  async addCreditCardToUser(card) {
    card.number = String(card.number).substr(-4);
    delete card.cvc;
    const res = await this.api.addCreditCardToUser(this.user, card);
  }

  async handleClick(card) {
    if (!this.user) {
      this.user = await this.api.createUser(this.state.form);
    }
    if (card) {
      this.addCreditCardToUser(card);
    }
    this.props.onClick(this.user);
  }

  render() {
    const { name, description, amount, currency, max, left } = this.props;

    const showCreditCardForm = this.props.requireCreditCard && (!this.user || !this.user.creditCards);

    return (
      <div className="SignInUp">
        <style jsx>{`
          .field {
            display: flex;
            flex-direction: column;
            margin: 10px 0;
          }
          .field label {
            color: ${colors.black}
          }
          .field input {
            margin: 5px 0;
          }
          .field .description {
            clear: left;
            font-size: 12px;
            color: ${colors.darkgray};
          }
        `}</style>
        {this.renderInputField({
          name: 'email',
          label: 'Email:',
          placeholder: 'youare@wesome.com',
          description
        })
        }
        {this.state.signup && 
          <div className="signup">
            {this.fields.map(this.renderInputField)}
          </div>
        }
        {showCreditCardForm &&
          <CreditCardForm
            addCardLabel={this.props.label}
            onCardAdded={this.handleClick}
            stripePublishableKey={this.props.stripePublishableKey}
            number="4242424242424242"
            expiration="11/2020"
            cvc="111"
            />
        }
        {!showCreditCardForm &&
        <div id="actions" className="actions">
          <Button className="blue" label={this.props.label} onClick={this.handleClick} />
        </div>}
      </div>
    );
  }
}

export default SignInUp;