import React from 'react';
import colors from '../constants/colors';
import Button from './Button';
import _ from 'lodash';
import { isValidEmail, capitalize } from '../lib/utils';
import CreditCardForm from './CreditCardForm';
import { defineMessages, injectIntl } from 'react-intl';

class SignInUp extends React.Component {

  static propTypes = {
    label: React.PropTypes.object,
    onSubmit: React.PropTypes.func, // onSubmit(user)
    emailOnly: React.PropTypes.bool,
    showLabels: React.PropTypes.bool,
    requireCreditCard: React.PropTypes.bool,
    stripePublishableKey: React.PropTypes.string,
    className: React.PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = { user: {} };
    this.renderInputField = this.renderInputField.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCardAdded = this.handleCardAdded.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.messages = defineMessages({
      'email.label': { id: 'signinup.email.label', defaultMessage: 'email' },
      'firstName.label': { id: 'signinup.firstName.label', defaultMessage: 'first name' },
      'lastName.label': { id: 'signinup.lastName.label', defaultMessage: 'last name' },
      'description.label': { id: 'signinup.description.label', defaultMessage: 'one liner' },
      'description.description': { id: 'signinup.description.description', defaultMessage: 'Present yourself in 60 characters or less, if you can!' },
      'twitterHandle.label': { id: 'signinup.twitterHandle.label', defaultMessage: 'twitter' }
    });

    this.fields = [
      {
        name: 'firstName',
        placeholder: ''
      },
      {
        name: 'lastName',
        placeholder: ''
      },
      {
        name: 'description',
        placeholder: ''
      },
      {
        name: 'twitterHandle',
        placeholder: '@xdamman'
      }
    ];
  }

  handleChange(fieldname, value) {
    const user = this.state.user;
    user[fieldname] = value;
    this.setState( { user });
  }

  renderInputField(field) {

    const debouncedHandleEvent = _.debounce(this.handleChange, 500);
    const { intl } = this.props;

    return (
      <div className="field" key={field.name} >
        {this.props.showLabels && this.messages[`${field.name}.label`] && <label>{`${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}</label>}
        <input type="text" ref={field.name} placeholder={field.placeholder} onChange={(event) => debouncedHandleEvent(field.name, event.target.value)} />
        {this.messages[`${field.name}.description`] && <span className="description">{intl.formatMessage(this.messages[`${field.name}.description`])}</span>}
      </div>
    );
  }

  handleCardAdded(card) {
    this.state.user.card = card;
    this.setState({ user: this.state.user });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.state.user.email = this.state.user.email.trim().toLowerCase();
    this.props.onSubmit(this.state.user);
  }

  componentDidMount() {
    this.refs.email.focus();
  }

  render() {
    const { description } = this.props;

    const showCreditCardForm = this.props.requireCreditCard && !this.state.user.creditCards;

    const isFormValid = isValidEmail(this.state.user.email) && (!this.props.requireCreditCard || this.state.user.card);

    return (
      <div className="SignInUp">
        <style jsx global>{`
          .SignInUp {
            margin: 0px auto;
            max-width: 400px;
          }
          .field {
            display: flex;
            width: 100%;
            flex-direction: column;
            margin: 1rem;
          }
          .field label {
            color: ${colors.black}
          }
          .field input {
            margin: 5px 0;
          }
          .field .description {
            clear: left;
            font-size: 1.2rem;
            color: ${colors.darkgray};
          }
        `}</style>
        <form onSubmit={this.handleSubmit}>
        {this.renderInputField({
          name: 'email',
          label: 'Email',
          placeholder: 'youare@wesome.com',
          description
        })
        }
        {!this.props.emailOnly && 
          <div className="signup">
            {this.fields.map(this.renderInputField)}
          </div>
        }
        {showCreditCardForm &&
          <CreditCardForm
            addCardLabel={this.props.label}
            onCardAdded={this.handleCardAdded}
            stripePublishableKey={this.props.stripePublishableKey}
            number={process.env.NODE_ENV === 'development' ? '4242424242424242' : undefined}
            expiration={process.env.NODE_ENV === 'development' ? '11/20' : undefined}
            disabled={!isFormValid}
            />
        }
        {!showCreditCardForm &&
        <div id="actions" className="actions">
          <Button type="submit" disabled={!isFormValid} className="green" label={this.props.label} />
        </div>}
        </form>
      </div>
    );
  }
}

SignInUp.defaultProps = {
  showLabels: true,
  stripePublishableKey: 'pk_test_5aBB887rPuzvWzbdRiSzV3QB'
}

export default injectIntl(SignInUp);