import React from 'react';
import PropTypes from 'prop-types';

import withIntl from '../lib/withIntl';

import { Flex } from 'grid-styled';
import { FormattedMessage, defineMessages } from 'react-intl';
import { P } from './Text';
import InputField from './InputField';
import styled from 'styled-components';

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
    onChange: PropTypes.func.isRequired,
  };

  static getDerivedStateFromProps(nextProps) {
    const { code, email, name, LoggedInUser } = nextProps;

    if (LoggedInUser) {
      return {
        form: {
          code,
          email: LoggedInUser.email,
          name: LoggedInUser.collective.name,
        },
      };
    } else {
      return { form: { code, email, name } };
    }
  }

  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

    this.messages = defineMessages({
      email: { id: 'user.email.label', defaultMessage: 'email' },
      name: { id: 'user.name.label', defaultMessage: 'name' },
      code: { id: 'redeem.form.code.label', defaultMessage: 'Gift card code' },
    });

    this.state = {};
  }

  handleChange(fieldname, value) {
    const { form } = this.state;
    form[fieldname] = value;
    this.setState({ form });
    this.props.onChange(form);
  }

  render() {
    const { intl, LoggedInUser } = this.props;
    const { code, email, name } = this.state.form;

    return (
      <div>
        <Description>
          {!LoggedInUser && (
            <FormattedMessage
              id="redeem.card.info"
              defaultMessage="It’s easy. Just provide your name and email address, enter your gift code and your open collective account will be created (if needed) and the gift card will be automatically attached to your account."
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

export default withIntl(RedeemForm);
