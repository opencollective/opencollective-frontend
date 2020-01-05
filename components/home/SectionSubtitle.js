import styled from 'styled-components';
import { color, display, space, typography } from 'styled-system';

const SectionTitle = styled.p`
  word-break: break-word;
  letter-spacing: -0.016em;

  ${color}
  ${display}
  ${space}
  ${typography}

  @media screen and (min-width: 64em) {
    font-size: 18px;
    line-height: ${props => props.theme.lineHeights.H5};
  }

  @media screen and (min-width: 88em) {
    font-size: ${props => props.theme.fontSizes.H4}px;
    line-height: ${props => props.theme.lineHeights.H4};
    letter-spacing: -0.8px;
  }
`;

SectionTitle.defaultProps = {
  fontSize: 'LeadParagraph',
  fontWeight: 300,
  lineHeight: '26px',
  color: 'black.900',
  mb: 3,
};

export default SectionTitle;
