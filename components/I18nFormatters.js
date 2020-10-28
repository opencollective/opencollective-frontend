import React from 'react';

import StyledLink from './StyledLink';

export const getI18nLink = linkProps => chunks => <StyledLink {...linkProps}>{chunks}</StyledLink>;
export const I18nBold = chunks => <strong>{chunks}</strong>;
export const I18nItalic = chunks => <i>{chunks}</i>;
export const I18nSupportLink = chunks => (
  <StyledLink href="mailto:support@opencollective.com">{chunks.length || 'support@opencollective.com'}</StyledLink>
);

const I18nFormatters = { strong: I18nBold, i: I18nItalic, SupportLink: I18nSupportLink };
export default I18nFormatters;
