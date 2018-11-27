import styled from 'styled-components';
import {
  bgColor,
  border,
  borderColor,
  borderRadius,
  color,
  display,
  fontFamily,
  fontSize,
  fontWeight,
  maxWidth,
  space,
  style,
  textAlign,
  width,
} from 'styled-system';
import tag from 'clean-tag';
import { whiteSpace } from './Text';
import { buttonSize, buttonStyle } from '../constants/theme';

const textDecoration = style({
  prop: 'textDecoration',
});

const StyledLink = styled(tag.a)`
  ${bgColor}
  ${border}
  ${borderColor}
  ${borderRadius}
  ${color}
  ${display}
  ${fontFamily}
  ${fontSize}
  ${fontWeight}
  ${maxWidth}
  ${space}
  ${textAlign}
  ${textDecoration}
  ${whiteSpace}
  ${width}

  ${buttonStyle}
  ${buttonSize}
`;

StyledLink.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle', 'buttonSize', 'whiteSpace'),
};

export default StyledLink;
