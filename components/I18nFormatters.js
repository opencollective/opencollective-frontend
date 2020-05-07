import React from 'react';

import StyledLink from './StyledLink';

export const getI18nLink = linkProps => msg => <StyledLink {...linkProps}>{msg}</StyledLink>;
export const I18nBold = msg => <strong>{msg}</strong>;
export const I18nItalic = msg => <i>{msg}</i>;
export const I18nSupportLink = msg => (
  <StyledLink href="mailto:support@opencollective.com">{msg || 'support@opencollective.com'}</StyledLink>
);

const I18nFormatters = { strong: I18nBold, i: I18nItalic, SupportLink: I18nSupportLink };
export default I18nFormatters;
