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
  font-size: 1.2rem;
  line-height: 1.5;
  margin: 12px 0;
`;

class RedeemForm extends React.Component {
  static propTypes = {
    code: PropTypes.string,
    email: PropTypes.string,
    onChange: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    const { code, email } = props;
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      form: { code, email },
    };

    this.messages = defineMessages({
      email: { id: 'user.email.label', defaultMessage: 'email' },
      code: { id: 'redeem.form.code.label', defaultMessage: 'Gift card code' },
    });
  }

  handleChange(fieldname, value) {
    const { form } = this.state;
    form[fieldname] = value;
    this.setState({ form });
    this.props.onChange(form);
  }

  render() {
    const { intl, code, email } = this.props;

    return (
      <div>
        <Description>
          <FormattedMessage
            id="redeem.card.info"
            defaultMessage="It’s easy. Sign in below with your email address, enter your gift code and find open collectives to donate to."
          />
        </Description>
        <Flex flexDirection="column">
          <InputField
            label={intl.formatMessage(this.messages['email'])}
            name="email"
            type="email"
            defaultValue={email}
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
