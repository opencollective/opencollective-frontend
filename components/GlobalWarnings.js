import React from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getDashboardRoute } from '../lib/url-helpers';

import { Button } from './ui/Button';
import I18nFormatters from './I18nFormatters';
import Link from './Link';
import { P } from './Text';

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
  const { LoggedInUser } = useLoggedInUser();

  if (collective?.isFrozen) {
    const isLoggedInUserHostAdmin = Boolean(LoggedInUser?.isHostAdmin(collective));

    // Frozen collectives
    return (
      <GlobalWarningContainer>
        <P fontWeight="700" lineHeight="20px" mb="6px">
          <FormattedMessage defaultMessage="Some actions are temporarily limited" id="KUZzwz" />
        </P>
        <P>
          <FormattedMessage defaultMessage="Contributions to this page cannot be accepted at this time" id="3tJstK" />
        </P>
        {isLoggedInUserHostAdmin && collective.host && (
          <Link href={getDashboardRoute(collective.host, `hosted-collectives/${collective.idV2}`)}>
            <Button variant="outline" className="mt-4">
              <FormattedMessage defaultMessage="Manage in Dashboard" id="Hz4EBy" />
            </Button>
          </Link>
        )}
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

export default GlobalWarnings;
