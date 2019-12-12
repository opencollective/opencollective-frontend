import styled, { css } from 'styled-components';

const SectionContainer = styled.section`
  margin: 0;
  ${props =>
    props.withPaddingBottom &&
    css`
      padding-bottom: 64px;
    `}
`;

export default SectionContainer;
