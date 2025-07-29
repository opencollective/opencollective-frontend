import React from 'react';
import { X } from 'lucide-react';
import styled from 'styled-components';

import { cn } from '../../lib/utils';

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

const DrawerCloseButton = ({ onClick }) => (
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
        <div className="absolute top-2 right-2">
          <DrawerCloseButton onClick={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
