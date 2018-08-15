import styled from 'styled-components';
import {
  background,
  borders,
  borderColor,
  borderRadius,
  color,
  display,
  fontSize,
  fontWeight,
  maxWidth,
  minWidth,
  space,
  textAlign,
  width,
} from 'styled-system';
import { overflow } from './Container';

const StyledInput = styled.input(
  [],
  background,
  borders,
  borderColor,
  borderRadius,
  color,
  display,
  fontSize,
  fontWeight,
  maxWidth,
  minWidth,
  overflow,
  space,
  textAlign,
  width,
);

StyledInput.defaultProps = {
  border: 'none',
};

export const TextInput = StyledInput.extend`
  border: 1px solid #cccccc;
  border-radius: 4px;
`;

TextInput.defaultProps = {
  fontSize: '14px',
  px: 2,
  py: 1,
  type: 'text',
};

export const SubmitInput = StyledInput.extend`
  border: none;
  border-radius: 30px;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

SubmitInput.defaultProps = {
  bg: '#3385ff',
  color: 'white',
  fontWeight: 'bold',
  maxWidth: 250,
  py: 2,
  type: 'submit',
  width: 1,
};

export default StyledInput;
