import styled from 'styled-components';
import { color, display, space, typography } from 'styled-system';

const SectionTitle = styled.h2`
  word-break: break-word;
  letter-spacing: -0.2px;
  font-weight: 500;

  ${color}
  ${display}
  ${space}
  ${typography}

  @media screen and (min-width: 64em) {
    font-size: ${props => props.theme.fontSizes.H2}px;
    line-height: 48px;
    letter-spacing: -1.2px;
  }
`;

SectionTitle.defaultProps = {
  fontSize: 'H4',
  lineHeight: 'H4',
  color: 'black.800',
  mb: 3,
};

export default SectionTitle;
