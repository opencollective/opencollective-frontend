import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { usePopper } from 'react-popper';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import useGlobalBlur from '../lib/hooks/useGlobalBlur';
import useEscapeKey, { ESCAPE_KEY } from '../lib/hooks/useKeyboardKey';

const Arrow = styled('div')`
  position: absolute;
  font-size: 8px;
  width: 3em;
  height: 3em;

  &::before {
    content: '';
    margin: auto;
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
  }
`;

const StyledMenuPopoverContainer = styled(`div`)`
  max-width: 320px;
  z-index: 1000000;
  opacity: 0.96 !important;
  border-radius: 4px;
  font-size: 12px;
  text-transform: initial;
  white-space: normal;
  color: white;
  background: white;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  border: 1px solid #e2e2e2;

  &[data-popper-placement*='bottom'] {
    ${Arrow} {
      top: 0;
      left: 0;
      margin-top: -1em;
      width: 3em;
      height: 1em;
      &::before {
        border-width: 0 1.5em 1em 1.5em;
        border-color: transparent transparent white transparent;
        filter: drop-shadow(0 0 0 grey);
      }
    }
  }
  &[data-popper-placement*='top'] {
    ${Arrow} {
      bottom: 0;
      left: 0;
      margin-bottom: -0.9em;
      width: 3em;
      height: 1em;
      &::before {
        border-width: 1em 1.5em 0 1.5em;
        border-color: white transparent transparent transparent;
        filter: drop-shadow(0 0 0 grey);
      }
    }
  }
  &[data-popper-placement*='right'] {
    ${Arrow} {
      left: 0;
      margin-left: -0.9em;
      height: 3em;
      width: 1em;
      &::before {
        border-width: 1.5em 1em 1.5em 0;
        border-color: transparent white transparent transparent;
        filter: drop-shadow(0 0 0 grey);
      }
    }
  }
  &[data-popper-placement*='left'] {
    ${Arrow} {
      right: 0;
      margin-right: -0.9em;
      height: 3em;
      width: 1em;
      &::before {
        border-width: 1.5em 0 1.5em 1em;
        border-color: transparent transparent transparent white;
        filter: drop-shadow(0 0 0 grey);
      }
    }
  }
`;

const InnerMenuContainer = styled.div`
  outline: none;
`;

const TooltipContent = ({ onClose, content, arrowProps, containerProps }) => {
  const innerRef = React.useRef();

  // Close on click outside
  useGlobalBlur(innerRef, isOutside => {
    if (isOutside) {
      onClose();
    }
  });

  // Close when Escape is pressed
  useEscapeKey({ callback: onClose, keyMatch: ESCAPE_KEY });

  // Focus menu when opening
  React.useEffect(() => {
    innerRef.current.focus();
  }, []);

  return (
    <StyledMenuPopoverContainer {...containerProps}>
      <InnerMenuContainer ref={innerRef} tabIndex="-1">
        {content({ onClose })}
      </InnerMenuContainer>
      <Arrow {...arrowProps} />
    </StyledMenuPopoverContainer>
  );
};

TooltipContent.propTypes = {
  content: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  arrowProps: PropTypes.object,
  containerProps: PropTypes.any,
};

const MenuPopover = ({ children, placement, content }) => {
  const [isMenuDisplayed, setIsMenuDisplayed] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const [id, setId] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: 'fixed',
    modifiers: [{ name: 'arrow', options: { element: arrowElement } }],
  });

  React.useEffect(() => {
    setId(`menu-popover-${uuid()}`); // We only set `id` on the client to avoid mismatches with SSR
  }, []);

  return (
    <React.Fragment>
      {children({ ref: setReferenceElement, onClick: () => setIsMenuDisplayed(true) })}

      {id && isMenuDisplayed && (
        <TooltipContent
          placement={placement}
          content={content}
          onClose={() => setIsMenuDisplayed(false)}
          arrowProps={{
            ref: setArrowElement,
            style: styles.arrow,
            ...attributes.arrow,
          }}
          containerProps={{
            ref: setPopperElement,
            style: styles.popper,
            ...attributes.popper,
          }}
        />
      )}
    </React.Fragment>
  );
};

MenuPopover.propTypes = {
  /** Tooltip place */
  placement: PropTypes.oneOf([
    'auto',
    'auto-start',
    'auto-end',
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'right',
    'right-start',
    'right-end',
    'left',
    'left-start',
    'left-end',
  ]),
  /** The popup content */
  content: PropTypes.func.isRequired,
  /** The trigger. Either:
   *  - A render func, that gets passed props to set on the trigger
   *  - A React node, rendered inside an div
   */
  children: PropTypes.func,
};

MenuPopover.defaultProps = {
  placement: 'top-start',
};

export default MenuPopover;
