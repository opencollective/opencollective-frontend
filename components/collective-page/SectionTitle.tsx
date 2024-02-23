import propTypes from '@styled-system/prop-types';
import type React from 'react';
import styled from 'styled-components';
import type { ColorProps, DisplayProps, SpaceProps, TypographyProps } from 'styled-system';
import { color, display, space, typography } from 'styled-system';

type SectionTitleProps = ColorProps &
  DisplayProps &
  SpaceProps &
  TypographyProps &
  React.HTMLAttributes<HTMLHeadingElement>;

const SectionTitle = styled.h2<SectionTitleProps>`
  word-break: break-word;

  ${color}
  ${display}
  ${space}
  ${typography}
`;

SectionTitle.defaultProps = {
  fontSize: '32px',
  lineHeight: '36px',
  fontWeight: 'normal',
  color: 'black.900',
  mb: 3,
};

SectionTitle.propTypes = {
  ...propTypes.color,
  ...propTypes.display,
  ...propTypes.space,
  ...propTypes.typography,
};

export default SectionTitle;
