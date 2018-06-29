import styled from 'styled-components';
import {
  background,
  borders,
  borderColor,
  borderRadius,
  color,
  disabled,
  display,
  focus,
  fontSize,
  fontWeight,
  maxWidth,
  minWidth,
  space,
  textAlign,
  width,
} from 'styled-system';

const StyledInput = styled.input([],
  background,
  borders,
  borderColor,
  borderRadius,
  color,
  disabled,
  display,
  focus,
  fontSize,
  fontWeight,
  maxWidth,
  minWidth,
  space,
  textAlign,
  width,
);

StyledInput.defaultProps = {
  border: 'none',
};

export default StyledInput;
