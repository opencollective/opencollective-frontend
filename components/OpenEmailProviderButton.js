import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import StyledButton from './StyledButton';
import ExternalLink from './ExternalLink';

/** Returns info about email's provider, or null if unknown provider */
const getProvider = email => {
  const providers = [
    {
      name: 'Gmail',
      regexp: /@gmail\.com$/,
      link:
        'https://mail.google.com/mail/u/2/#advanced-search/subject=Open+Collective%3A+Login&amp;subset=all&amp;within=2d',
    },
    {
      name: 'Outlook',
      regexp: /@(outlook|hotmail)\.(.+)$/,
      link: 'https://outlook.live.com/mail/inbox',
    },
  ];

  return providers.find(provider => provider.regexp.test(email));
};

/**
 * If email is recognized as a known provider (GMail/Hotmail), a button will be displayed
 * with a link to directly open user's inbox. Otherwise this will return null;
 */
const OpenEmailProviderButton = ({ email, children }) => {
  const provider = getProvider(email);
  return !provider
    ? null
    : children(
        <ExternalLink data-cy="open-inbox-link" href={provider.link}>
          <StyledButton buttonStyle="primary" minWidth={200} mx={2} my={3}>
            <FormattedMessage
              id="OpenInbox"
              defaultMessage="Open {providerName}"
              values={{ providerName: provider.name }}
            />
          </StyledButton>
        </ExternalLink>,
      );
};

OpenEmailProviderButton.propTypes = {
  email: PropTypes.string,
  /** Called with the button component if email is recognized */
  children: PropTypes.func.isRequired,
};
export default OpenEmailProviderButton;
