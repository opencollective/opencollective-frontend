import styled from 'styled-components';

import StyledButton from '../StyledButton';

const FilterButtonContainer = styled(StyledButton)`
  min-height: 38px;
  outline: 0;
  background: #f7f8fa;
  padding: 0 16px;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: hsl(0, 0%, 20%);

  svg {
    transition: color 0.2s;
  }

  &:hover {
    border-color: #c4c7cc;
    svg {
      color: #999999;
    }
  }

  &:active,
  &:focus {
    background: white;
    color: hsl(0, 0%, 20%);
    box-shadow: 0 0 0 2px black;
  }
`;

export default FilterButtonContainer;
