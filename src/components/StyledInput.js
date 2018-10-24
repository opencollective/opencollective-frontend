import styled from 'styled-components';
import {
  background,
  borders,
  borderColor,
  borderRadius,
  color,
  display,
  flex,
  fontSize,
  fontWeight,
  maxWidth,
  minWidth,
  variant,
  space,
  textAlign,
  width,
} from 'styled-system';
import tag from 'clean-tag';
import { overflow } from './Container';

const buttonStyle = variant({
  key: 'buttons',
  prop: 'buttonStyle',
});

const StyledInput = styled(tag.input)(
  [],
  background,
  borders,
  borderColor,
  borderRadius,
  color,
  display,
  flex,
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
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle'),
  border: 'none',
};

export const TextInput = styled(StyledInput)``;

TextInput.defaultProps = {
  border: '1px solid #cccccc',
  borderRadius: '4px',
  fontSize: '14px',
  px: 3,
  py: 2,
  type: 'text',
};

export const SubmitInput = styled(StyledInput)`
  ${buttonStyle};
`;

SubmitInput.defaultProps = {
  buttonStyle: 'primary',
  fontSize: 14,
  fontWeight: 'bold',
  px: 5,
  py: 3,
  type: 'submit',
};

export default StyledInput;
