import React from 'react';

import Link from './Link';
import StyledLink from './StyledLink';

// eslint-disable-next-line react/display-name
export const getI18nLink = linkProps => chunks => <StyledLink {...linkProps}>{chunks}</StyledLink>;
export const I18nBold = chunks => <strong>{chunks}</strong>;
export const I18nItalic = chunks => <i>{chunks}</i>;
export const I18nSupportLink = chunks => (
  <StyledLink href="mailto:support@opencollective.com">
    {chunks.length ? chunks : 'support@opencollective.com'}
  </StyledLink>
);
export const I18nSignInLink = chunks => (
  <Link href="signin" params={{ next: typeof window !== undefined ? window.location.pathname : '' }}>
    {chunks}
  </Link>
);

export const I18nTOSLink = msg => (
  <Link href="tos">
    <span>{msg}</span>
  </Link>
);
export const I18nPrivacyLink = msg => (
  <Link href="privacypolicy">
    <span>{msg}</span>
  </Link>
);

const I18nFormatters = {
  strong: I18nBold,
  i: I18nItalic,
  SupportLink: I18nSupportLink,
  SignInLink: I18nSignInLink,
  TOSLink: I18nTOSLink,
  PrivacyPolicyLink: I18nPrivacyLink,
};

export default I18nFormatters;
