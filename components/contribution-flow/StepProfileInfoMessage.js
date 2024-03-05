import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { cn } from '../../lib/utils';

import Container from '../Container';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBox from '../MessageBox';
import { P } from '../Text';

const StepProfileInfoMessage = ({ hasLegalNameField, hasIncognito, isGuest }) => {
  const nbItems = hasLegalNameField + isGuest + hasIncognito;
  const isList = nbItems > 1;
  const ItemContainer = isList ? 'li' : 'span';
  return (
    <MessageBox type="info" fontSize="12px" color="black.800" my={3} px="32px" py="16px">
      <Container fontSize="12px" lineHeight="18px">
        <P fontWeight="bold" fontSize="12px" lineHeight="18px">
          <FormattedMessage defaultMessage="About privacy" />
        </P>
        <ul className={cn('mt-2 space-y-2 text-xs', { 'list-disc': isList })}>
          {isGuest && (
            <ItemContainer>
              <FormattedMessage defaultMessage="Every contribution must be linked to an email account for legal reasons. Please provide a valid email. We wont send any spam or advertising, pinky promise." />
            </ItemContainer>
          )}
          {hasLegalNameField && (
            <ItemContainer>
              <FormattedMessage defaultMessage="You can leave the name field empty if you don't want your name to be publicly associated with the contribution. Only the Collective/Host admins and the platform will have access to your legal name." />
            </ItemContainer>
          )}
          {hasIncognito && (
            <ItemContainer>
              <FormattedMessage
                defaultMessage="When you contribute to a Collective we share your email address with the Administrators. If you wish to keep your contribution private choose the ‘incognito’ profile. Read our <PrivacyPolicyLink>privacy policy</PrivacyPolicyLink>."
                values={{ PrivacyPolicyLink: getI18nLink({ href: '/privacypolicy', openInNewTab: true, as: Link }) }}
              />
            </ItemContainer>
          )}
        </ul>
      </Container>
    </MessageBox>
  );
};

StepProfileInfoMessage.propTypes = {
  hasLegalNameField: PropTypes.bool,
  isGuest: PropTypes.bool,
  hasIncognito: PropTypes.bool,
};

StepProfileInfoMessage.defaultProps = {
  hasLegalNameField: false,
  isGuest: false,
  hasIncognito: false,
};

export default StepProfileInfoMessage;
