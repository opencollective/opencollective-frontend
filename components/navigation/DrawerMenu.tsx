import React from 'react';
import MUIDrawer from '@mui/material/Drawer';
import { X } from 'lucide-react';
import styled, { css } from 'styled-components';
import { space, SpaceProps } from 'styled-system';

import { useTwoFactorAuthenticationPrompt } from '../../lib/two-factor-authentication/TwoFactorAuthenticationContext';

import Link from '../Link';
import StyledRoundButton from '../StyledRoundButton';

const StyledDrawerContainer = styled.div<{ maxWidth: string }>`
  display: flex;
  height: 100vh;
  max-width: ${props => props.maxWidth};
  width: 100vw;
  flex-direction: column;
  hr {
    margin: 8px 0;
    border-color: #f3f4f6;
  }

  ${space}
`;

const StyledMUIDrawer = styled(MUIDrawer)`
  height: 100vh !important;
  z-index: 3000;
  .MuiDrawer-paper {
    border-radius: ${props => (props.anchor === 'left' ? '0 12px 12px 0' : '12px 0 0 12px')};
  }
  .MuiBackdrop-root {
    background-color: rgba(0, 0, 0, 0.25);
  }
`;

const StyledCloseButton = styled(StyledRoundButton)`
  width: 32px;
  height: 32px;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledMenuItem = styled(Link)`
  border: 0;
  background-color: transparent;
  color: #334155;
  padding: 8px 8px;
  margin: 0 16px;
  font-size: 14px;
  border-radius: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  transition-property: color, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  span {
    text-overflow: ellipsis;
    overflow: hidden;
  }
  &:hover {
    background-color: #f4f5f7;
    color: #334155;
    text-decoration: none;
    svg {
      color: #334155;
    }
    .show-on-hover {
      color: #94a3b8 !important;
    }
  }

  .show-on-hover {
    color: transparent !important;
    transition-property: color, background-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
  svg {
    color: #94a3b8;
  }

  ${props =>
    props.$isActive
      ? css({
          backgroundColor: 'primary.100',
        })
      : css({
          ':hover': {
            backgroundColor: 'black.50',
          },
        })}
`;

export const DrawerMenuItem = ({ href = undefined, onClick = undefined, children, ...props }) => (
  <StyledMenuItem href={href} onClick={onClick} {...props}>
    {children}
  </StyledMenuItem>
);

export const DrawerCloseButton = ({ onClick }) => (
  <StyledCloseButton type="button" isBorderless onClick={onClick}>
    <X size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden="true" />
  </StyledCloseButton>
);

type DrawerMenuProps = {
  onClose: () => void;
  open: boolean;
  anchor?: 'left' | 'right';
  children: React.ReactNode;
} & SpaceProps;

export const DrawerMenu = ({ onClose, open, anchor = 'right', children, ...props }: DrawerMenuProps) => {
  const twoFactorPrompt = useTwoFactorAuthenticationPrompt();
  const disableEnforceFocus = Boolean(twoFactorPrompt?.isOpen);

  return (
    <React.Fragment>
      <StyledMUIDrawer anchor={anchor} open={open} onClose={onClose} disableEnforceFocus={disableEnforceFocus}>
        <StyledDrawerContainer maxWidth="280px" {...props}>
          {children}
        </StyledDrawerContainer>
      </StyledMUIDrawer>
    </React.Fragment>
  );
};
