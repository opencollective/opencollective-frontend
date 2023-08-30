import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Link from './Link';

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 26px;
  text-align: center;
  flex-wrap: wrap;

  a {
    text-decoration-line: underline;
    text-underline-offset: 3px;
    color: #323334;
  }
  a:hover {
    color: #DC5F7D;
`;

type ErrorFallbackLinksProps = {
  showHome?: boolean;
  showSlack?: boolean;
  showDiscover?: boolean;
  showDocumentation?: boolean;
  showSupport?: boolean;
};

/**
 * Some links to render on error pages
 */
export const ErrorFallbackLinks = ({
  showHome = true,
  showSlack = false,
  showDiscover = false,
  showDocumentation = true,
  showSupport = true,
}: ErrorFallbackLinksProps) => {
  return (
    <LinksContainer>
      {showHome && (
        <Link href="https://opencollective.com/">
          <FormattedMessage id="home" defaultMessage="Home" />
        </Link>
      )}
      {showSlack && <Link href="https://slack.opencollective.com/">Slack</Link>}
      <Link href="https://opencollective.com/discover">
        {showDiscover && <FormattedMessage id="menu.discover" defaultMessage="Discover" />}
      </Link>
      {showDocumentation && (
        <Link href="https://docs.opencollective.com">
          <FormattedMessage id="menu.documentation" defaultMessage="Documentation" />
        </Link>
      )}
      {showSupport && (
        <Link href="mailto:support@opencollective.com">
          <FormattedMessage id="community.support" defaultMessage="Support" />
        </Link>
      )}
    </LinksContainer>
  );
};
