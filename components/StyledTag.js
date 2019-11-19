import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { background, border, color, space, typography, layout, position } from 'styled-system';

import { Times } from 'styled-icons/fa-solid/Times';

import { messageType } from '../lib/theme';
import { Span } from './Text';

const StyledTagBase = styled.div`
  border-radius: 4px;
  padding: 8px;
  font-size: 8px;
  letter-spacing: 0.2em;
  line-height: 12px;
  text-transform: uppercase;
  background: #F0F2F5;
  color: #71757A;
  text-align: center;

  & > * {
    vertical-align: middle;
  }

  ${background}
  ${border}
  ${color}
  ${space}
  ${border}
  ${typography}
  ${layout}
  ${position}

  ${messageType}
`;

const CloseButton = styled.button`
  border-radius: 50%;
  background: #212121;
  color: white;
  mix-blend-mode: color-burn;
  cursor: pointer;
  margin: 0px;
  text-align: center;
  line-height: 1;
  padding: 4px;
  width: 2.5em;
  height: 2.5em;
  &:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

/** Simple tag to display a short string */
const StyledTag = ({ closeButtonProps, children, ...props }) => {
  return !closeButtonProps ? (
    <StyledTagBase {...props}>{children}</StyledTagBase>
  ) : (
    <StyledTagBase py={1} {...props}>
      <Span mr={2}>{children}</Span>
      <CloseButton {...closeButtonProps}>
        <Times size="1em" />
      </CloseButton>
    </StyledTagBase>
  );
};

StyledTag.propTypes = {
  /** If defined, a close button will be displayed on the tag */
  closeButtonProps: PropTypes.object,
  children: PropTypes.node,
};

export default StyledTag;
