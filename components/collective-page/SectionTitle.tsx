import type React from 'react';
import styled from 'styled-components';
import type { ColorProps, DisplayProps, SpaceProps, TypographyProps } from 'styled-system';
import { color, display, space, typography } from 'styled-system';

type SectionTitleProps = ColorProps &
  DisplayProps &
  SpaceProps &
  TypographyProps &
  React.HTMLAttributes<HTMLHeadingElement>;

const SectionTitle = styled.h2.attrs<SectionTitleProps>(props => ({
  fontSize: props.fontSize ?? '32px',
  lineHeight: props.lineHeight ?? '36px',
  fontWeight: props.fontWeight ?? 'normal',
  color: props.color ?? 'black.900',
  mb: props.mb ?? 3,
}))<SectionTitleProps>`
  word-break: break-word;

  ${color}
  ${display}
  ${space}
  ${typography}
`;

export default SectionTitle;
