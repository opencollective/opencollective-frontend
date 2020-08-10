import styled from 'styled-components';
import { color, display, space, typography } from 'styled-system';

const SectionTitle = styled.p`
  word-break: break-word;
  letter-spacing: -0.016px;
  ${color}
  ${display}
  ${space}
  ${typography}

  @media screen and (min-width: 88em) {
    font-size: 24px;
    line-height: 32px;
    letter-spacing: -0.8px;
  }
`;

SectionTitle.defaultProps = {
  fontSize: '16px',
  fontWeight: 500,
  lineHeight: '24px',
  color: 'black.700',
  mb: 3,
};

export default SectionTitle;
