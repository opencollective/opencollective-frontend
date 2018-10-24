import styled from 'styled-components';
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
  style,
  textAlign,
  variant,
  width,
} from 'styled-system';
import tag from 'clean-tag';
import { whiteSpace } from './Text';

const textDecoration = style({
  prop: 'textDecoration',
});

const buttonStyle = variant({
  key: 'buttons',
  prop: 'buttonStyle',
});

const StyledLink = styled(tag.a)`
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
  ${textDecoration}
  ${whiteSpace}
  ${width}

  ${buttonStyle}
`;

StyledLink.defaultProps = {
  blacklist: tag.defaultProps.blacklist.concat('buttonStyle'),
};

export default StyledLink;
