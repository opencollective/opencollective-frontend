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
  space,
  textAlign,
  width,
} from 'styled-system';
import tag from 'clean-tag';
import { overflow } from './Container';
import { buttonSize, buttonStyle } from '../constants/theme';

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
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle', 'buttonSize'),
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
  ${buttonSize};
`;

SubmitInput.defaultProps = {
  buttonStyle: 'primary',
  buttonSize: 'large',
  fontWeight: 'bold',
  type: 'submit',
};

export default StyledInput;
