import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { Flex } from './Grid';
import InputField from './InputField';
import LoadingPlaceholder from './LoadingPlaceholder';
import { P } from './Text';

const Description = styled(P)`
  color: #4e5052;
  font-size: 1.3rem;
  line-height: 1.5;
  margin: 12px 0;
`;

class RedeemForm extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    code: PropTypes.string,
    email: PropTypes.string,
    name: PropTypes.string,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
  };

  static getDerivedStateFromProps(nextProps, nextState) {
    const { LoggedInUser } = nextProps;
    const code = nextState.form.code || nextProps.code;

    if (LoggedInUser) {
      return {
        form: {
          code,
          email: LoggedInUser.email,
          name: LoggedInUser.collective.name,
        },
      };
    } else {
      return {
        form: {
          code,
          email: nextState.form.email || nextProps.email,
          name: nextState.form.name || nextProps.name,
        },
      };
    }
  }

  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

    this.messages = defineMessages({
      email: { id: 'Email', defaultMessage: 'Email' },
      name: { id: 'Fields.name', defaultMessage: 'Name' },
      code: { id: 'redeem.form.code.label', defaultMessage: 'Gift Card code' },
    });

    this.state = { form: {} };
  }

  handleChange(fieldname, value) {
    const { form } = this.state;
    form[fieldname] = value;
    this.setState({ form });
    this.props.onChange(form);
  }

  render() {
    const { intl, LoggedInUser, loadingLoggedInUser } = this.props;
    const { code, email, name } = this.state.form;

    return (
      <div>
        <Description>
          {!LoggedInUser && (
            <FormattedMessage
              id="redeem.card.info"
              defaultMessage="It\'s easy! Just enter your name, email address, and gift card code. We will create an account for you if you don't already have one. Then you'll be able to select the gift card balance as the payment method when making a contribution."
            />
          )}
          {LoggedInUser && (
            <FormattedMessage
              id="redeem.card.authenticated"
              defaultMessage="You are currently logged in. Sign out if you want to redeem with a different account."
            />
          )}
        </Description>
        <Flex flexDirection="column">
          {loadingLoggedInUser ? (
            <LoadingPlaceholder height={156} mb={2} />
          ) : (
            <React.Fragment>
              <InputField
                label={intl.formatMessage(this.messages['name'])}
                name="name"
                type="name"
                defaultValue={name}
                disabled={LoggedInUser}
                onChange={value => this.handleChange('name', value)}
              />
              <InputField
                label={intl.formatMessage(this.messages['email'])}
                name="email"
                type="email"
                defaultValue={email}
                disabled={LoggedInUser}
                onChange={value => this.handleChange('email', value)}
              />
            </React.Fragment>
          )}
          <InputField
            label={intl.formatMessage(this.messages['code'])}
            name="code"
            type="text"
            defaultValue={code}
            onChange={value => this.handleChange('code', value)}
          />
        </Flex>
      </div>
    );
  }
}

export default injectIntl(RedeemForm);
