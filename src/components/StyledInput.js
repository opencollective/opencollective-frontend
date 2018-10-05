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
import tag from 'clean-tag';
import { overflow } from './Container';

const StyledInput = styled(tag.input)(
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

export const TextInput = styled(StyledInput)`
  border: 1px solid #cccccc;
  border-radius: 4px;
`;

TextInput.defaultProps = {
  fontSize: '14px',
  px: 3,
  py: 2,
  type: 'text',
};

export const SubmitInput = styled(StyledInput)`
  border: none;
  border-radius: 30px;
  opacity: ${props => (props.disabled ? 0.5 : 1)};
`;

SubmitInput.defaultProps = {
  bg: '#3385ff',
  color: 'white',
  fontSize: 14,
  fontWeight: 'bold',
  px: 5,
  py: 3,
  type: 'submit',
};

export default StyledInput;
