import React, { useRef } from 'react';
import styled, { css } from 'styled-components';

export const DropdownContent = styled.div`
  display: none;
  position: absolute;
  z-index: 1;
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
 */
export const Dropdown = styled(({ children, trigger, ...props }) => {
  const dropdownRef = useRef();
  const [isDisplayed, setDisplayed] = React.useState(false);

  if (typeof children === 'function' && trigger === 'click') {
    return (
      <div {...props} data-expanded={isDisplayed}>
        {children({
          isDisplayed,
          triggerProps: {
            onClick: () => setDisplayed(!isDisplayed),
            onBlur: () => {
              if (isDisplayed) {
                setTimeout(() => {
                  if (!document.activeElement || !dropdownRef.current?.contains(document.activeElement)) {
                    setDisplayed(false);
                  }
                }, 50);
              }
            },
          },
          dropdownProps: {
            ref: dropdownRef,
            onBlur: () => setTimeout(() => setDisplayed(false), 50),
            onClick: () => setTimeout(() => setDisplayed(false), 50),
          },
        })}
      </div>
    );
  }

  return (
    <div
      tabIndex={0}
      trigger={trigger}
      {...props}
      onFocus={() => setTimeout(() => setDisplayed(true), 50)}
      onBlur={() => setTimeout(() => setDisplayed(false), 50)}
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
