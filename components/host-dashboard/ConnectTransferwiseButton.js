import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';

/**
 * A button for hosts to either connect or refill the balance for their PayPal account.
 */
const ConnectTransferwiseButton = ({ isConnected }) => {
  return (
    <StyledLink
      openInNewTab
      href={
        isConnected
          ? 'https://transferwise.com/user/account'
          : 'https://docs.opencollective.com/help/fiscal-hosts/payouts/payouts-with-transferwise#connecting-transferwise'
      }
    >
      <StyledButton buttonStyle="secondary" isBorderless buttonSize="tiny" fontSize="10px" fontWeight="normal">
        {isConnected ? (
          <FormattedMessage id="ConnectPaypal.refill" defaultMessage="Refill balance" />
        ) : (
          <FormattedMessage
            id="collective.connectedAccounts.transferwise.button"
            defaultMessage="Connect TransferWise"
          />
        )}
      </StyledButton>
    </StyledLink>
  );
};

ConnectTransferwiseButton.propTypes = {
  isConnected: PropTypes.bool,
};

export default ConnectTransferwiseButton;
