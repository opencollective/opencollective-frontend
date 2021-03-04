import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp/ChevronUp';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import { size, space } from 'styled-system';

import Container from '../Container';
import { Box } from '../Grid';
import { P } from '../Text';

/** Main entry container */
export const Entry = styled.details`
  &[open] {
    border-color: ${themeGet('colors.primary.500')};

    summary::after {
      content: '−';
    }
  }

  summary {
    padding-top: ${themeGet('space.2')}px;
    padding-bottom: ${themeGet('space.2')}px;
    font-size: 13px;
    font-weight: 500;
    color: ${themeGet('colors.black.800')};
    /* Remove arrow on Firefox */
    list-style: none;

    &:hover {
      color: ${themeGet('colors.black.700')};
    }

    button {
      display: none;
    }
  }

  summary:focus {
    outline: 1px dashed ${themeGet('colors.black.200')};
    outline-offset: ${themeGet('space.1')}px;
  }

  summary::after {
    content: '+';
    display: inline-block;
    padding-left: ${themeGet('space.2')}px;
    color: ${themeGet('colors.black.600')};
    font-weight: bold;
  }

  /* Remove arrow on Chrome */
  summary::-webkit-details-marker {
    display: none;
  }
`;

const CollapseBtn = styled.div`
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

/** Entry title */
export const Title = styled(({ children, ...props }) => (
  <summary {...props}>
    <div>{children}</div>
    <CollapseBtn size={18} ml={3}>
      <ChevronUp size="1em" data-item="chevron-up" style={{ marginTop: -1 }} />
      <ChevronDown size="1em" data-item="chevron-down" />
    </CollapseBtn>
  </summary>
))`
  cursor: pointer;
  display: flex;
  justify-content: space-between;
`;

/** Entry content (hidden by default) */
export const Content = styled(Box)``;
Content.defaultProps = {
  py: 2,
  fontSize: '13px',
  color: 'black.600',
};

export const Separator = styled.hr`
  background: ${themeGet('colors.black.400')};
  width: 100%;
`;

/** A simple wrapper to group entries */
const EntryContainer = styled.div`
  ${Entry} {
    ${props =>
      props.withNewButtons
        ? css`
            [data-item='chevron-up'] {
              display: none;
            }

            &[open] {
              [data-item='chevron-up'] {
                display: inline-block;
              }
              [data-item='chevron-down'] {
                display: none;
              }
            }

            summary::after {
              display: none;
            }

            button {
              display: block;
            }
          `
        : css`
            ${CollapseBtn} {
              display: none;
            }
          `}

    ${props =>
      props.withBorderLeft &&
      css`
        border-left: 1px solid #dcdee0;
        padding-left: 8px;

        &:focus-within,
        &:hover {
          border-color: ${themeGet('colors.primary.500')};
        }
      `}
  }
`;

/**
 * A small FAQ with expendable contents. You don't actually have
 */
export default class FAQ extends Component {
  static propTypes = {
    children: PropTypes.node,
    /** The title to display above entries. Set to null to disable it. */
    title: PropTypes.string,
    /** Props for styling the title */
    titleProps: PropTypes.object,
    /** If true, a border will be displayed on the left  */
    withBorderLeft: PropTypes.bool,
    /** If true, will display a button with a chevron instead of the `+` sign  */
    withNewButtons: PropTypes.bool,
    /** All properties from `Box` */
    ...Box.propTypes,
  };

  render() {
    const { title, children, withBorderLeft, withNewButtons, titleProps, ...props } = this.props;
    return (
      <Container {...props}>
        {title !== null && (
          <P fontWeight="bold" mb={1} color="black.900" {...titleProps}>
            {title || <FormattedMessage id="FAQ" defaultMessage="FAQ" />}
          </P>
        )}
        <EntryContainer withBorderLeft={withBorderLeft} withNewButtons={withNewButtons}>
          {children}
        </EntryContainer>
      </Container>
    );
  }
}
