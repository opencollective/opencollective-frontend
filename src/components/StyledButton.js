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
  width,
} from 'styled-system';
import { buttonSize, buttonStyle } from '../constants/theme';

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
  ${buttonSize}
`;

StyledButton.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle', 'buttonSize'),
  buttonSize: 'medium',
  buttonStyle: 'standard',
};

export default StyledButton;
