import React from 'react';
import { FormattedMessage } from 'react-intl';

import Link from './Link';
import StyledLink from './StyledLink';

// ignore unused exports
// utility library

// eslint-disable-next-line react/display-name
export const getI18nLink = linkProps => chunks => (
  <StyledLink {...linkProps}>{linkProps?.children || chunks}</StyledLink>
);
export const I18nBold = chunks => <strong>{chunks}</strong>;
export const I18nItalic = chunks => <i>{chunks}</i>;
export const I18nCode = chunks => <code>{chunks}</code>;

export const I18nUnderline = chunks => <u>{chunks}</u>;
export const I18nSupportLink = chunks => (
  <StyledLink as={Link} openInNewTab href="/contact">
    {chunks.length ? chunks : <FormattedMessage defaultMessage="support" />}
  </StyledLink>
);
export const I18nSignInLink = chunks => (
  <StyledLink
    as={Link}
    href={{ pathname: '/signin', query: { next: typeof window !== 'undefined' ? window.location.pathname : '' } }}
  >
    {chunks}
  </StyledLink>
);

export const I18nTOSLink = msg => (
  <StyledLink as={Link} href="/tos">
    <span>{msg}</span>
  </StyledLink>
);
export const I18nPrivacyLink = msg => (
  <StyledLink as={Link} href="/privacypolicy">
    <span>{msg}</span>
  </StyledLink>
);

export const I18nWithColumn = item => <FormattedMessage id="withColon" defaultMessage="{item}:" values={{ item }} />;

export const WebsiteName = 'Open Collective';

const I18nFormatters = {
  strong: I18nBold,
  i: I18nItalic,
  code: I18nCode,
  u: I18nUnderline,
  SupportLink: I18nSupportLink,
  SignInLink: I18nSignInLink,
  TOSLink: I18nTOSLink,
  PrivacyPolicyLink: I18nPrivacyLink,
  WebsiteName,
};

export default I18nFormatters;
