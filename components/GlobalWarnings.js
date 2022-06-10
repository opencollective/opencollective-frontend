import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import I18nFormatters from './I18nFormatters';
import { P } from './Text';
import { useUser } from './UserProvider';

const GlobalWarningContainer = styled.div`
  width: 100;
  background: #ffffc2;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  padding: 14px;
  border-top: 1px solid #eaeaec;
  color: #0c2d66;
`;

/**
 * Displays warnings related to the user account.
 */
const GlobalWarnings = ({ collective }) => {
  const { LoggedInUser } = useUser();

  if (collective?.isFrozen) {
    // Frozen collectives
    return (
      <GlobalWarningContainer>
        <P fontWeight="700" lineHeight="20px" mb="6px">
          <FormattedMessage defaultMessage="Some actions are temporarily limited" />
        </P>
        <P>
          <FormattedMessage defaultMessage="Contributions to this page cannot be accepted at this time" />
        </P>
      </GlobalWarningContainer>
    );
  } else if (LoggedInUser && LoggedInUser.isLimited) {
    // Limited user accounts
    return (
      <GlobalWarningContainer>
        <FormattedMessage
          id="warning.limitedAccount"
          defaultMessage="Your account is currently limited. If you think this is a mistake, please <SupportLink>contact support</SupportLink>."
          values={I18nFormatters}
        />
      </GlobalWarningContainer>
    );
  }

  return null;
};

GlobalWarnings.propTypes = {
  collective: PropTypes.shape({
    isFrozen: PropTypes.bool,
  }),
};

export default GlobalWarnings;
