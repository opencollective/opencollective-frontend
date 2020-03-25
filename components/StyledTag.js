import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { background, border, color, space, typography, layout, position } from 'styled-system';

import { Times } from '@styled-icons/fa-solid/Times';

import { textTransform } from '../lib/styled-system-custom-properties';
import { messageType } from '../lib/theme/variants/message';
import { Span } from './Text';

const StyledTagBase = styled.div`
  border-radius: 4px;
  padding: 8px;
  font-size: 8px;
  line-height: 12px;
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
  ${textTransform}

  ${messageType}
`;

const CloseButton = styled.button`
  border-radius: 50%;
  background: ${closeButtonProps => closeButtonProps.iconBackgroundColor};
  color: ${closeButtonProps => closeButtonProps.iconColor};
  mix-blend-mode: color-burn;
  cursor: pointer;
  margin: 0px;
  text-align: center;
  line-height: 1;
  padding: 4px;
  width: ${closeButtonProps => closeButtonProps.iconWidth};
  height: ${closeButtonProps => closeButtonProps.iconHeight};
  display: ${closeButtonProps => closeButtonProps.iconDisplay};
  align-items: ${closeButtonProps => closeButtonProps.iconAlign};
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
      <Span mr={2} letterSpacing="inherit">
        {children}
      </Span>
      <CloseButton {...closeButtonProps}>
        <Times size="1em" />
      </CloseButton>
    </StyledTagBase>
  );
};

StyledTag.propTypes = {
  closeButtonProps: PropTypes.object,
  /** If defined, a close button will be displayed on the tag */
  onClose: PropTypes.func,
  iconWidth: PropTypes.string,
  iconHeight: PropTypes.string,
  backgroundColor: PropTypes.string,
  iconColor: PropTypes.string,
  iconDisplay: PropTypes.string,
  iconAlign: PropTypes.string,
  children: PropTypes.node,
};

StyledTag.defaultProps = {
  textTransform: 'uppercase',
  iconHeight: '2.5em',
  iconWidth: '2.5em',
  iconBackgroundColor: 'rgba(33, 33, 33, 1)',
  iconColor: 'white',
};

export default StyledTag;
