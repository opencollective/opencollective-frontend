import styled from 'styled-components';

import StyledButton from '../StyledButton';

const OCFPrimaryButton = styled(StyledButton)`
  background: linear-gradient(180deg, #4f7d7f 0%, #396c6f 100%);
  border-color: transparent;
  color: #ffffff;
  &:focus {
    border: solid 2px #90f0bd;
    background: linear-gradient(to bottom, #7a9899, #527d80 99%);
  }
  &:active {
    background: linear-gradient(to bottom, #7a9899, #527d80 99%);
  }
  &:hover {
    border-color: transparent;
    background: linear-gradient(to bottom, #7a9899, #527d80 99%);
  }
`;

export default OCFPrimaryButton;
