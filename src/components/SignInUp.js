import React from 'react';
import colors from '../constants/colors';
import Button from './Button';
import _ from 'lodash';
import { isValidEmail } from '../lib/utils';
import CreditCardForm from './CreditCardForm';
import { css } from 'glamor';
import '../css/forms.css';

const styles = {
  SignInUp: css({
    margin: '0px auto',
    maxWidth: '400px'
  })
}

class SignInUp extends React.Component {

  static propTypes = {
    label: React.PropTypes.string,
    onSubmit: React.PropTypes.func, // onSubmit(user)
    emailOnly: React.PropTypes.bool,
    showLabels: React.PropTypes.bool,
    requireCreditCard: React.PropTypes.bool,
    stripePublishableKey: React.PropTypes.string,
    className: React.PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = { form: {} };
    this.user = {};
    this.renderInputField = this.renderInputField.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCardAdded = this.handleCardAdded.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.fields = [
      {
        name: 'firstName',
        label: 'First name:',
        placeholder: '',
        description: ''
      },
      {
        name: 'lastName',
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
        name: 'twitterHandle',
        label: 'Twitter:',
        placeholder: '@xdamman',
        description: ''
      }
    ];
  }

  handleChange(fieldname, value) {
    this.state.form[fieldname] = value;
    if (fieldname === 'email') {
      this.setState({ valid: isValidEmail(value) })
    }
  }

  renderInputField(field) {

    const debouncedHandleEvent = _.debounce(this.handleChange, 500);

    return (
      <div className="field" key={field.name} >
        {this.props.showLabels && <label>{field.label}</label>}
        <input type="text" ref={field.name} placeholder={field.placeholder} onChange={(event) => debouncedHandleEvent(field.name, event.target.value)} />
        <span className="description">{field.description}</span>
      </div>
    );
  }

  handleCardAdded(card) {
    this.user.card = card;
  }

  handleSubmit(event) {
    event.preventDefault();
    this.user = this.state.form;
    this.props.onSubmit(this.user);
  }

  componentDidMount() {
    this.refs.email.focus();
  }

  render() {
    const { name, description, amount, currency, max, left } = this.props;

    const showCreditCardForm = this.props.requireCreditCard && (!this.user || !this.user.creditCards);

    return (
      <div className={styles.SignInUp}>
        <style>{`
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
        <form onSubmit={this.handleSubmit}>
        {this.renderInputField({
          name: 'email',
          label: 'Email:',
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
            number="4242424242424242"
            expiration="11/2020"
            cvc="111"
            />
        }
        {!showCreditCardForm &&
        <div id="actions" className="actions">
          <Button type="submit" disabled={!this.state.valid} className="green" label={this.props.label} />
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

export default SignInUp;