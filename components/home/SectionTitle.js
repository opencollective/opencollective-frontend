import styled from 'styled-components';
import { color, display, space, typography } from 'styled-system';

const SectionTitle = styled.h1`
  word-break: break-word;
  letter-spacing: -0.2px;

  ${color}
  ${display}
  ${space}
  ${typography}

  @media screen and (min-width: 64em) {
    font-size: ${props => props.theme.fontSizes.H2}px;
    line-height: 48px;
    letter-spacing: -0.8px;
  }

  @media screen and (min-width: 88em) {
    font-size: ${props => props.theme.fontSizes.H1}px;
    line-height: ${props => props.theme.lineHeights.H1};
    letter-spacing: -0.8px;
  }
`;

SectionTitle.defaultProps = {
  fontSize: 'H4',
  lineHeight: 'H4',
  color: 'black.900',
  mb: 3,
};

export default SectionTitle;
