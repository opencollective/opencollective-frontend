import { styled } from 'styled-components';

import StyledButton from '../StyledButton';

const FilterButtonContainer = styled(StyledButton)`
  min-height: 38px;
  outline: 0;
  background: var(--color-gray-50);
  padding: 0 16px;
  width: 100%;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-gray-800);

  svg {
    transition: color 0.2s;
  }

  &:hover {
    border-color: var(--color-gray-300);
    svg {
      color: var(--color-gray-500);
    }
  }

  &:active,
  &:focus {
    background: var(--color-white);
    color: var(--color-gray-800);
    box-shadow: 0 0 0 2px var(--color-gray-900);
  }
`;

export default FilterButtonContainer;
