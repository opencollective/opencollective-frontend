import styled from 'styled-components';
import tag from 'clean-tag';
import {
  bgColor,
  border,
  borderRadius,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  maxWidth,
  space,
  textAlign,
  variant,
  width,
} from 'styled-system';

const buttonStyle = variant({
  key: 'buttons',
  prop: 'buttonStyle',
});

const StyledButton = styled(tag.button)`
  appearance: none;
  border: none;

  ${bgColor}
  ${border}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${maxWidth}
  ${space}
  ${textAlign}
  ${width}

  ${buttonStyle}
`;

StyledButton.defaultProps = {
  buttonStyle: 'standard',
};

export default StyledButton;
