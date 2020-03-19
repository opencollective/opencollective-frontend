import React from 'react';
import StyledLink from './StyledLink';

export const I18nBold = msg => <strong>{msg}</strong>;
export const I18nItalic = msg => <i>{msg}</i>;
export const getI18nLink = linkProps => msg => <StyledLink {...linkProps}>{msg}</StyledLink>;
const I18nFormatters = { strong: I18nBold, i: I18nItalic };
export default I18nFormatters;
