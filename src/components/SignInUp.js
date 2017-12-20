import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import Button from './Button';
import _ from 'lodash';
import { isValidEmail, capitalize } from '../lib/utils';
import { defineMessages, injectIntl } from 'react-intl';

class SignInUp extends React.Component {

  static propTypes = {
    label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    onSubmit: PropTypes.func, // onSubmit(user)
    emailOnly: PropTypes.bool,
    showLabels: PropTypes.bool,
    requireCreditCard: PropTypes.bool,
    className: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.state = { user: {} };
    this.nodes = {};
    this.renderInputField = this.renderInputField.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCardAdded = this.handleCardAdded.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.messages = defineMessages({
      'email.label': { id: 'signinup.email.label', defaultMessage: 'email' },
      'firstName.label': { id: 'signinup.firstName.label', defaultMessage: 'first name' },
      'lastName.label': { id: 'signinup.lastName.label', defaultMessage: 'last name' },
      'description.label': { id: 'signinup.description.label', defaultMessage: 'one liner' },
      'description.help': { id: 'signinup.description.description', defaultMessage: 'Present yourself in 60 characters or less, if you can!' },
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
      <div className="field" key={field.name}>
        {this.props.showLabels && this.messages[`${field.name}.label`] && <label>{`${capitalize(intl.formatMessage(this.messages[`${field.name}.label`]))}:`}</label>}
        <input type="text" ref={ref => this.nodes[field.name] = ref} placeholder={field.placeholder} onChange={(event) => debouncedHandleEvent(field.name, event.target.value)} />
        {this.messages[`${field.name}.help`] && <span className="description">{intl.formatMessage(this.messages[`${field.name}.help`])}</span>}
      </div>
    );
  }

  handleCardAdded(card) {
    this.state.user.card = card;
    this.setState({ user: this.state.user });
  }

  async handleSubmit(e) {
    e && e.preventDefault();
    this.setState({ loading: true });
    this.state.user.email = this.state.user.email.trim().toLowerCase();
    await this.props.onSubmit(this.state.user);
    this.setState({ loading: false });
  }

  componentDidMount() {
    this.nodes.email && this.nodes.email.focus();
  }

  render() {
    const { description } = this.props;

    const isFormValid = isValidEmail(this.state.user.email) && (!this.props.requireCreditCard || this.state.user.card);
    const isLoading = this.state.loading;

    const submitBtnLabel = (isLoading) ? 'loading' : this.props.label;

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

          <div id="actions" className="actions">
            <Button type="submit" disabled={!isFormValid || isLoading} className="green" label={submitBtnLabel} onClick={this.handleSubmit}/>
          </div>
        </form>
      </div>
    );
  }
}

SignInUp.defaultProps = {
  showLabels: true
}

export default injectIntl(SignInUp);