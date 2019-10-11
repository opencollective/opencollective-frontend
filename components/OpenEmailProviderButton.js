import React from 'react';
import PropTypes from 'prop-types';
import StyledButton from './StyledButton';
import { FormattedMessage } from 'react-intl';

function OpenEmailProviderButton({ email }) {
  const gmailregex = /@gmail\.com$/.test(email);
  const hotmailregex = /@outlook\.com$/.test(email);
  const gmaillink =
    'https://mail.google.com/mail/u/2/#advanced-search/subject=Open+Collective%3A+Login&amp;subset=all&amp;within=1d';
  const hotmaillink = 'https://outlook.live.com/mail/inbox';
  const btntext = gmailregex ? 'Gmail' : hotmailregex ? 'HotMail' : 'Inbox';
  const link = gmailregex ? gmaillink : hotmailregex ? hotmaillink : '';
  const emailProvider = gmailregex || hotmailregex ? true : false;

  return emailProvider ? (
    <div>
      <a data-cy="open-inbox-link" href={link}>
        <StyledButton buttonStyle="primary" minWidth={200} mx={2} my={3}>
          <FormattedMessage id="openinbox" defaultMessage={`Open {buttontext}`} values={{ buttontext: btntext }} />
        </StyledButton>
      </a>
    </div>
  ) : null;
}

OpenEmailProviderButton.propTypes = {
  email: PropTypes.string,
};
export default OpenEmailProviderButton;
