import React from 'react';
import PropTypes from 'prop-types';
import InputField from '../components/InputField';
import { Button, Row, Col, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import { isValidEmail } from '../lib/utils';
import withIntl from '../lib/withIntl';
import * as api from '../lib/api';

class LoginForm extends React.Component {

  static propTypes = {
    signin: PropTypes.bool,
    next: PropTypes.string,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    const { intl } = props;

    this.state = {
      isNewUser: null,
      loginSent: false,
      loading: false,
      user: {},
      result: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);

    this.messages = defineMessages({
      'api.error.unreachable': { id: 'api.error.unreachable', defaultMessage: "Can't reach the API. Please try again in a few." },
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
    const { intl } = this.props;

    this.resetError();
    const newState = { ... this.state };
    if (value !== undefined) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (attr === 'email') {
      const email = value && value.trim();
      if (isValidEmail(email)) {
        api.checkUserExistence(email).then(exists => {
          if (exists) {
            this.setState({ signup: false, loginSent: false });
          }
          this.setState({ isNewUser: !exists });
        })
        .catch(e => {
          if (e.message === "ECONNREFUSED") {
            this.error(intl.formatMessage(this.messages['api.error.unreachable']));
          }
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
    this.state.user.email = this.state.user.email && this.state.user.email.trim();
    if (!isValidEmail(this.state.user.email)) {
      return;
    }
    this.setState({ loading: true });
    api.signin(this.state.user, this.props.next).then((result) => {
      console.log(">>> api.signin result", result);
      this.setState({ loginSent: true, signup: false, isNewUser: false, loading: false });
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
      button: <Button disabled={true}><FormattedMessage id="login.button" defaultMessage="login" /></Button>,
      required: true,
      focus: true,
      label: intl.formatMessage(this.messages['email.label']),
      defaultValue: this.state.user['email'],
      onChange: (value) => this.handleChange("user", "email", value)
    };

    if (this.state.loading) {
      inputEmail.button = <Button disabled={true}><FormattedMessage id="loading" defaultMessage="loading" /></Button>;
      inputEmail.description = <FormattedMessage id="signin.loading.description" defaultMessage="Please wait..." />;
    } else if (!this.state.signup) {
      if (this.state.isNewUser === true) {
        inputEmail.button = <Button onClick={() => this.setState({ signup: true })}><FormattedMessage id="signin.createAccount" defaultMessage="Sign Up" /></Button>;
        inputEmail.description = <FormattedMessage id="signin.createAccount.description" defaultMessage={`There is no user with this email address. Click on "Sign Up" to create a new Open Collective Account.`} />;
      } else if (this.state.isNewUser === false) {
        inputEmail.button = <Button onClick={() => this.signin()}><FormattedMessage id="login.button" defaultMessage="login" /></Button>;
        inputEmail.description = <FormattedMessage id="signin.login.description" defaultMessage={`Welcome back! Click on "Login" (or hit Enter) and we will send you a link to login by email.`} />;
        if (this.state.loginSent) {
          inputEmail.button = <Button disabled={true}><FormattedMessage id="login.button" defaultMessage="login" /></Button>;
          inputEmail.description = <FormattedMessage id="signin.emailSent.description" defaultMessage={`Login email sent. Please follow the instructions in that email to proceed.`} />
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
        <div className="content">
          <Form horizontal onSubmit={this.handleSubmit}>
            <div className="userDetailsForm">
              <h2><FormattedMessage id="loginform.title" defaultMessage="login" /></h2>
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
                      <Button bsStyle="primary" onClick={() => this.handleSubmit()}>
                        <FormattedMessage id="signin.createAccount" defaultMessage="Sign Up" />
                      </Button>
                    </Col>
                  </Row>
                </div>
              }
          </div>
          <div className="result">
            {this.state.result.success &&
              <div className="success">
                {this.state.result.success}
              </div>
            }
            { this.state.result.error &&
              <div className="error">
                {this.state.result.error}
              </div>
            }
          </div>
        </Form>
        </div>
      </div>
    )
  }
}

export default withIntl(LoginForm);