import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import MUIDrawer from '@mui/material/Drawer';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { createGlobalStyle } from 'styled-components';

import { useTwoFactorAuthenticationPrompt } from '../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { cn } from '../lib/utils';

import StyledRoundButton from './StyledRoundButton';

export const DrawerActionsContext = createContext(null);

export const useDrawerActionsContainer = () => useContext(DrawerActionsContext);

const GlobalDrawerStyle = createGlobalStyle<{ drawedWidth: number }>`
  :root {
    --drawer-width: ${({ drawedWidth }) => drawedWidth}px;
  }
`;

export function Drawer({
  open,
  onClose,
  children,
  className,
  showActionsContainer,
  showCloseButton = false,
  'data-cy': dataCy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  showActionsContainer?: boolean;
  showCloseButton?: boolean;
  'data-cy'?: string;
  className?: string;
}) {
  const [drawerActionsContainer, setDrawerActionsContainer] = useState(null);
  const twoFactorPrompt = useTwoFactorAuthenticationPrompt();
  const disableEnforceFocus = Boolean(twoFactorPrompt?.isOpen);

  const drawerRef = useRef();
  const [drawedWidth, setDrawerWidth] = useState(0);

  useEffect(() => {
    if (!drawerRef.current) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      setDrawerWidth(entries[0].contentRect.width);
    });
    observer.observe(drawerRef.current);
    return () => drawerRef.current && observer.unobserve(drawerRef.current);
  }, [drawerRef.current]);

  return (
    <DrawerActionsContext.Provider value={drawerActionsContainer}>
      <GlobalDrawerStyle drawedWidth={drawedWidth} />
      <MUIDrawer
        className="[&_.MuiBackdrop-root]:bg-slate-950/25"
        anchor="right"
        open={open}
        onClose={onClose}
        disableEnforceFocus={disableEnforceFocus}
      >
        <div ref={drawerRef} className={cn('flex h-full w-screen max-w-lg flex-col', className)} data-cy={dataCy}>
          <div className="flex flex-1 flex-col overflow-y-scroll">
            <div className="relative py-6">
              {showCloseButton && (
                <StyledRoundButton
                  className="absolute right-5 top-5"
                  size={36}
                  type="button"
                  isBorderless
                  onClick={onClose}
                  data-cy="close-drawer"
                >
                  <X size={20} aria-hidden="true" />
                </StyledRoundButton>
              )}

              <div className="px-4 sm:px-6">{children}</div>
            </div>
          </div>
          {showActionsContainer && (
            <div
              className="flex flex-shrink-0 flex-wrap justify-between gap-2 border-t p-4"
              ref={ref => setDrawerActionsContainer(ref)}
            />
          )}
        </div>
      </MUIDrawer>
    </DrawerActionsContext.Provider>
  );
}

export function DrawerActions(props: React.PropsWithChildren) {
  const drawerActionsContainer = useDrawerActionsContainer();

  if (!drawerActionsContainer) {
    return null;
  }

  return createPortal(props.children, drawerActionsContainer);
}

export function DrawerHeader({
  title,
  statusTag,
  onClose,
  ...props
}: {
  title: React.ReactNode;
  statusTag?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4" {...props}>
      <h3 className="mt-1 text-lg font-medium text-slate-900">{title}</h3>
      <div className="flex flex-col-reverse items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
        {statusTag}
        <StyledRoundButton size={36} type="button" isBorderless onClick={onClose} data-cy="close-drawer">
          <X size={20} aria-hidden="true" />
        </StyledRoundButton>
      </div>
    </div>
  );
}
