import React from 'react';
import NextLink from 'next/link';

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
  <NextLink href="signin" params={{ next: typeof window !== undefined ? window.location.pathname : '' }}>
    {chunks}
  </NextLink>
);

export const I18nTOSLink = msg => (
  <NextLink href="tos">
    <span>{msg}</span>
  </NextLink>
);
export const I18nPrivacyLink = msg => (
  <NextLink href="privacypolicy">
    <span>{msg}</span>
  </NextLink>
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
