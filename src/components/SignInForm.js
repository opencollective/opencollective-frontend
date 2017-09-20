import React from 'react';
import PropTypes from 'prop-types';
import InputField from '../components/InputField';
import ActionButton from '../components/Button';
import { Button, HelpBlock, Row, Col, Form, FormControl } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import { isValidEmail } from '../lib/utils';
import { getStripeToken, isValidCard } from '../lib/stripe';
import { pick } from 'lodash';
import withIntl from '../lib/withIntl';
import { checkUserExistence, signin } from '../lib/api';

class LoginForm extends React.Component {

  static propTypes = {
    signin: PropTypes.bool,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      isNewUser: null,
      loginSent: false,
      user: {},
      result: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);

    this.messages = defineMessages({
      'type.label': { id: 'tier.type.label', defaultMessage: 'type' },
      'firstName.label': { id: 'user.firstName.label', defaultMessage: 'first name' },
      'lastName.label': { id: 'user.lastName.label', defaultMessage: 'last name' },
      'website.label': { id: 'user.website.label', defaultMessage: 'website' },
      'twitterHandle.label': { id: 'user.twitterHandle.label', defaultMessage: 'twitter' },
      'twitterHandle.description': { id: 'user.twitterHandle.description', defaultMessage: 'If any' },
      'email.label': { id: 'user.email.label', defaultMessage: 'email' },
      'description.label': { id: 'user.description.label', defaultMessage: 'Short bio' },
      'description.description': { id: 'user.description.description', defaultMessage: 'Present yourself in 60 characters or less, if you can!' },
    });

    this.fields = [
      {
        name: 'firstName',
        focus: true
      },
      {
        name: 'lastName'
      },
      {
        name: 'website'
      },
      {
        name: 'twitterHandle',
        pre: '@',
        validate: (val) => val.match(/^[A-Za-z0-9_]{1,15}$/)
      },
      {
        name: 'description'
      }
    ]

    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
    })
  }

  handleChange(obj, attr, value) {
    this.resetError();
    const newState = { ... this.state };

    if (value !== undefined) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (attr === 'email') {
      if (isValidEmail(value)) {
        checkUserExistence(value).then(exists => {
          if (exists) {
            this.setState({ signup: false, loginSent: false });
          }
          this.setState({ isNewUser: !exists });
        });
      }
    }

    this.setState(newState);
    if (typeof window !== "undefined") {
      window.state = newState;
    }
  }

  error(msg) {
    this.setState({ result: { error: msg }});
  }

  resetError() {
    this.setState({ result: { error: null }});
  }

  signin() {
    signin(this.state.user, window.location.href).then(() => {
      this.setState({ loginSent: true, signup: false, isNewUser: false });
    })
  }

  handleSubmit(e) {
    e && e.preventDefault();
    this.signin();
    return false;
  }

  render() {
    const { intl } = this.props;

    const inputEmail = {
      type: 'email',
      name: 'email',
      required: true,
      focus: true,
      label: intl.formatMessage(this.messages['email.label']),
      defaultValue: this.state.user['email'],
      onChange: (value) => this.handleChange("user", "email", value)
    };

    if (!this.state.signup) {
      if (this.state.isNewUser === true) {
        inputEmail.button = <Button onClick={() => this.setState({ signup: true })}>Sign Up</Button>;
        inputEmail.description = `There is no user with this email address. Click on "Sign Up" to create a new Open Collective Account.`;
      } else if (this.state.isNewUser === false) {
        inputEmail.button = <Button onClick={() => this.signin()} focus={true}>Login</Button>;
        inputEmail.description = `Welcome back! Click on "Login" (or hit Enter) and we will send you a link to login by email.`;
        if (this.state.loginSent) {
          inputEmail.button = <Button disabled={true}>Login</Button>;
          inputEmail.description = `Login email sent. Please follow the instructions in that email to proceed.`
        }
      }
    }

    return (
      <div className="LoginForm">
        <style jsx>{`
        h2 {
          margin: 3rem 0 3rem 0;
        }
        .LoginForm {
          max-width: 700px;
          margin: 0 auto;
        }
        .userDetailsForm {
          overflow: hidden;
        }
        .paymentDetails {
          overflow: hidden;
        }
        .LoginForm :global(.tier) {
          margin: 0 0 1rem 0;
        }
        label {
          max-width: 100%;
          padding-right: 1rem;
        }
        .result {
          margin-top: 3rem;
        }
        .result div {
          width: 100%;
        }
        .error {
          color: red;
          font-weight: bold;
        }
        :global(.col-sm-12) {
          width: 100%;
        }
        .value {
          padding-top: 7px;
          display: inline-block;
        }
        @media (min-width: 768px) {
          .actions {
            margin: 6rem 0 6rem 26%;
          }
        }
        `}</style>
        <Form horizontal onSubmit={this.handleSubmit}>
          <div className="userDetailsForm">
            <h2><FormattedMessage id="loginform.title" defaultMessage="Login" /></h2>
              <Row key={`email.input`}>
                <Col sm={12}>
                  <InputField
                    className="horizontal"
                    {...inputEmail}
                    />
                </Col>
              </Row>
            {this.state.isNewUser && this.state.signup && 
              <div>
                { this.fields.map(field => (
                  <Row key={`${field.name}.input`}>
                    <Col sm={12}>
                      <InputField
                        className="horizontal"
                        {...field}
                        defaultValue={this.state.user[field.name]}
                        onChange={(value) => this.handleChange("user", field.name, value)}
                        />
                    </Col>
                  </Row>
                ))}
                <Row>
                  <Col sm={3}></Col>
                  <Col sm={9}>
                    <Button bsStyle="primary" onClick={() => this.handleSubmit()}>Sign Up</Button>
                  </Col>
                </Row>
              </div>
            }
        </div>
          
      </Form>
        
      </div>
    )
  }
}

export default withIntl(LoginForm);