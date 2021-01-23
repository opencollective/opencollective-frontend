import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { I18nSupportLink } from '../I18nFormatters';

import FAQ, { Content, Entry, Title } from './FAQ';

const HostPayouts2FARollingLimitFAQ = ({ defaultOpen, currency, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="RollingLimitFAQ.enable" defaultMessage="What happens when I enable 2FA for payouts?" />
      </Title>
      <Content>
        <FormattedMessage
          id="RollingLimitFAQ.enable.content"
          defaultMessage="You will be asked to authenticate with your 2FA code when you make the first payment after turning it on, and again once you've hit the rolling limit you've set."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="RollingLimitFAQ.amount" defaultMessage="How do I set the rolling limit?" />
      </Title>
      <Content>
        <FormattedMessage
          id="RollingLimitFAQ.amount.content"
          defaultMessage="The default rolling limit is {defaultLimitWithCurrency}. You can change this using the input field above."
          values={{
            defaultLimitWithCurrency: <FormattedMoneyAmount amount={1000000} currency={currency} precision={2} />,
          }}
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage
          id="RollingLimitFAQ.admins"
          defaultMessage="Do all admins need to use 2FA if we turn it on?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="RollingLimitFAQ.admins.content"
          defaultMessage="Yes. Once 2FA is enabled for payouts, each Host admin must set up 2FA on their accounts for login in order to make payouts."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="RollingLimitFAQ.disable" defaultMessage="How do I disable 2FA once it\'s been enabled?" />
      </Title>
      <Content>
        <FormattedMessage
          id="RollingLimitFAQ.disable.content"
          defaultMessage="For security purposes, 2FA can only be disabled by contacting <I18nSupportLink>support</I18nSupportLink>."
          values={{
            I18nSupportLink,
          }}
        />
      </Content>
    </Entry>
  </FAQ>
);

HostPayouts2FARollingLimitFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
  currency: PropTypes.string.isRequired,
};

export default HostPayouts2FARollingLimitFAQ;
