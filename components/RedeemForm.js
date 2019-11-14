import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { P } from './Text';
import InputField from './InputField';
import styled from 'styled-components';
import LoadingPlaceholder from './LoadingPlaceholder';

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
      email: { id: 'user.email.label', defaultMessage: 'email' },
      name: { id: 'user.name.label', defaultMessage: 'name' },
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
              defaultMessage="It's easy! Just enter your name, email address and gift code. We will create an account for you if you don't already have one. You'll be able to select the gift card as the payment method when making a contribution."
            />
          )}
          {LoggedInUser && (
            <FormattedMessage
              id="redeem.card.authenticated"
              defaultMessage="You are currently authenticated. Sign Out first if you want to redeem with another account."
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
