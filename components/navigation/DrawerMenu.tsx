import React from 'react';
import { X } from 'lucide-react';
import styled, { css } from 'styled-components';

import { cn } from '../../lib/utils';

import Link from '../Link';
import StyledRoundButton from '../StyledRoundButton';
import { Sheet, SheetContent } from '../ui/Sheet';

const StyledCloseButton = styled(StyledRoundButton)`
  width: 32px;
  height: 32px;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledMenuItem = styled(Link)<{ $isActive?: boolean }>`
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
  className?: string;
};

export const DrawerMenu = ({ onClose, open, anchor = 'right', children, className, ...props }: DrawerMenuProps) => {
  return (
    <Sheet
      open={open}
      onOpenChange={open => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        side={anchor}
        className={cn('max-w-72 p-0', anchor === 'right' ? 'rounded-l-2xl' : 'rounded-r-2xl', className)}
        {...props}
      >
        {children}
        <div className="absolute right-2 top-2">
          <DrawerCloseButton onClick={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
