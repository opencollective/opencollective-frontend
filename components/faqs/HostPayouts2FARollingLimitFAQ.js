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
          defaultMessage="When you go to make payments from the Host dashboard, you will be asked to authenticate with your 2FA code when you make the first payment. Then you will be allowed to make payments that add up to the rolling limit you've set."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="RollingLimitFAQ.amount" defaultMessage="How do I set the rolling limit amount?" />
      </Title>
      <Content>
        <FormattedMessage
          id="RollingLimitFAQ.amount.content"
          defaultMessage="The default rolling limit amount is {defaultLimitWithCurrency}. You can reset this using the input field above."
          values={{
            defaultLimitWithCurrency: <FormattedMoneyAmount amount={1000000} currency={currency} precision={2} />,
          }}
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="RollingLimitFAQ.admins" defaultMessage="Who can make payments with 2FA enabled?" />
      </Title>
      <Content>
        <FormattedMessage
          id="RollingLimitFAQ.admins.content"
          defaultMessage="Only host admins will be able to make payments with 2FA enabled. Once 2FA is enabled for payouts, host admins must set up 2FA on their accounts for login before being able to continue making payouts."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="RollingLimitFAQ.disable" defaultMessage="How do I disable 2FA once it's been enabled?" />
      </Title>
      <Content>
        <FormattedMessage
          id="RollingLimitFAQ.disable.content"
          defaultMessage="For security purposes, 2FA can only be disabled by contacting <I18nSupportLink>support</I18nSupportLink> once it has been enabled."
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
