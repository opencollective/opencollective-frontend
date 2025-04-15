import React from 'react';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp/ChevronUp';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';
import type { SizeProps, SpaceProps } from 'styled-system';
import { size, space } from 'styled-system';

import Container from './Container';

const Details = styled(Container).attrs({
  as: 'details',
})<React.HTMLProps<HTMLDetailsElement>>`
  summary {
    list-style-type: none;
    > div {
      display: flex;
      cursor: pointer;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
      color: ${themeGet('colors.black.800')};
      /* Remove arrow on Firefox */
      list-style: none;

      &:hover {
        color: ${themeGet('colors.black.700')};
      }
    }

    [data-item='chevron-up'] {
      display: none;
    }
    [data-item='chevron-down'] {
      display: inline-block;
      margin-top: 5%;
    }
  }

  &[open] {
    summary {
      [data-item='chevron-up'] {
        display: inline-block;
        margin-top: -5%;
      }
      [data-item='chevron-down'] {
        display: none;
      }
    }
  }

  summary:focus {
    outline: 1px dashed ${themeGet('colors.black.200')};
    outline-offset: ${themeGet('space.1')}px;
  }

  /* Remove arrow */
  summary::-webkit-details-marker {
    display: none;
  }
  summary::marker {
    display: none;
  }
`;

type CollapseBtnProps = SizeProps & SpaceProps & React.HTMLProps<HTMLButtonElement>;

const CollapseBtn = styled.div<CollapseBtnProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border: 1px solid #dcdee0;

  svg {
    stroke-width: 1.5;
  }

  [data-item='chevron-up'] {
    margin-top: -5%;
  }

  [data-item='chevron-down'] {
    margin-top: 5%;
  }

  ${size}
  ${space}
`;

interface CollapseProps {
  title?: React.ReactNode;
  children?: React.ReactNode;
  defaultIsOpen?: boolean;
  buttonSize?: number | string;
}

/**
 * A stylized version of the `details` HTML element to hide & show content when clicked.
 */
const Collapse = ({
  children,
  title,
  buttonSize = 18,
  defaultIsOpen,
  ...props
}: CollapseProps) => {
  return (
    <Details open={defaultIsOpen} {...props}>
      {title && (
        <summary>
          <div>
            <div>{title}</div>
            <CollapseBtn size={buttonSize} ml={3}>
              <ChevronUp size="60%" data-item="chevron-up" />
              <ChevronDown size="60%" data-item="chevron-down" />
            </CollapseBtn>
          </div>
        </summary>
      )}
      {children}
    </Details>
  );
};

export default Collapse;
