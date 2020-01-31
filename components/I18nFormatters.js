import React from 'react';
import StyledLink from './StyledLink';

export const I18nBold = msg => <strong>{msg}</strong>;
export const getI18nLink = linkProps => msg => <StyledLink {...linkProps}>{msg}</StyledLink>;
