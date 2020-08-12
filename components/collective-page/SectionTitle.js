import styled from 'styled-components';
import { color, display, space, typography } from 'styled-system';

const SectionTitle = styled.h2`
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

export default SectionTitle;
