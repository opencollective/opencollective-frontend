import React, { useRef } from 'react';
import styled, { css } from 'styled-components';
import { flexbox } from 'styled-system';

import useGlobalBlur from '../lib/hooks/useGlobalBlur';
import useKeyBoardShortcut, { ESCAPE_KEY } from '../lib/hooks/useKeyboardKey';

export const DropdownContent = styled.div`
  display: none;
  position: absolute;
  max-width: 320px;
  z-index: 1000000;
  border-radius: 4px;
  font-size: 12px;
  text-transform: initial;
  white-space: normal;
  color: white;
  background: white;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  border: 1px solid #e2e2e2;
`;

export const DropdownArrow = styled('div')`
  position: absolute;
  font-size: 8px;
  width: 3em;
  height: 3em;
  width: 3em;
  height: 1em;
  z-index: 1000001;
  margin-left: 50px;
  margin-top: -7px;
  display: none;

  &::before {
    border-width: 0 1.5em 1em 1.5em;
    border-color: transparent transparent white transparent;
    filter: drop-shadow(0 0 0 grey);
    content: '';
    margin: auto;
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
  }
`;

/**
 * Accessible, CSS-first dropdown.
 *
 * When using `click` as a `trigger` you must pass a function as `children` and
 * make sure you pass down the `triggerProps` and `dropdownProps`.
 * The ref must be on the wrapping div in order to work in Firefox (Mac) and Safari.
 *
 * @deprecated Use `ui/DropdownMenu` instead
 */
export const Dropdown = styled(({ children, trigger, ...props }) => {
  const dropdownRef = useRef(undefined);
  const [isDisplayed, setDisplayed] = React.useState(false);
  const closeDropdown = React.useCallback(() => {
    if (isDisplayed) {
      setDisplayed(false);
    }
  }, [isDisplayed]);

  useGlobalBlur(dropdownRef, outside => {
    if (outside && isDisplayed) {
      setTimeout(() => {
        setDisplayed(false);
      }, 50);
    }
  });

  // Closes the modal upon the `ESC` key press.
  useKeyBoardShortcut({ callback: closeDropdown, keyMatch: ESCAPE_KEY });

  if (typeof children === 'function' && trigger === 'click') {
    return (
      <div {...props} ref={dropdownRef} data-expanded={isDisplayed}>
        {children({
          isDisplayed,
          triggerProps: {
            onClick: () => {
              setDisplayed(!isDisplayed);
            },
          },
          dropdownProps: {
            onClick: () => setTimeout(closeDropdown, 50),
            onBlur: () =>
              setTimeout(() => {
                if (!document.activeElement || !dropdownRef.current?.contains(document.activeElement)) {
                  closeDropdown();
                }
              }, 50),
          },
        })}
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      role="button"
      tabIndex={0}
      trigger={trigger}
      {...props}
      onFocus={() => setTimeout(() => setDisplayed(true), 50)}
      onBlur={() => setTimeout(closeDropdown, 50)}
      onClick={e => {
        if (isDisplayed) {
          if (document.activeElement?.contains(e.target)) {
            document.activeElement.blur();
          } else {
            e.target.blur();
          }
        }
      }}
    >
      {children}
    </div>
  );
})`
  ${flexbox}
  ${props =>
    props.trigger === 'hover'
      ? css`
          &:hover,
          &:active,
          &:focus-within {
            ${DropdownContent}, ${DropdownArrow} {
              display: block;
            }
          }
        `
      : css`
          &[data-expanded='true'] {
            ${DropdownContent}, ${DropdownArrow} {
              display: block;
            }
          }
        `}
`;
