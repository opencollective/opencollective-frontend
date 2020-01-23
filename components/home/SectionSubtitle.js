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
    font-size: ${props => props.theme.fontSizes.H5}px;
    line-height: 28px;
  }
`;

SectionTitle.defaultProps = {
  fontSize: '15px',
  fontWeight: 300,
  lineHeight: '25px',
  color: 'black.700',
  mb: 3,
};

export default SectionTitle;
