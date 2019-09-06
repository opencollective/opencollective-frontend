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
  fontSize: 'H3',
  lineHeight: 'H3',
  fontWeight: 'normal',
  color: 'black.900',
  mb: 3,
};

export default SectionTitle;
