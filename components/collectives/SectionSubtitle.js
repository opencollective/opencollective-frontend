import styled from 'styled-components';
import { color, display, space, typography } from 'styled-system';

const SectionTitle = styled.p.attrs(props => ({
  fontSize: props.fontSize ?? '16px',
  fontWeight: props.fontWeight ?? 700,
  lineHeight: props.lineHeight ?? '24px',
  color: props.color ?? 'black.700',
  mb: props.mb ?? 3,
  mt: props.mt ?? 0,
}))`
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

export default SectionTitle;
