import React from 'react';
import PropTypes from 'prop-types';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import { Box } from './Grid';

const StyledTooltipContainer = styled(`div`)`
  max-width: 320px;
  z-index: 1000000;
  opacity: 0.96 !important;
  border-radius: 8px;
  box-shadow: 0px 3px 6px 1px rgba(20, 20, 20, 0.08);
  padding: 16px;
  font-size: 12px;
  text-transform: initial;
  white-space: normal;
  color: white;
  border: 1px solid #f3f3f3;
  background: black;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
`;

const Arrow = styled('div')`
  position: absolute;
  width: 3em;
  height: 3em;
  &[data-placement*='bottom'] {
    top: 0;
    left: 0;
    margin-top: -0.9em;
    width: 3em;
    height: 1em;
    &::before {
      border-width: 0 1.5em 1em 1.5em;
      border-color: transparent transparent #00000f transparent;
      filter: drop-shadow(0px -3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &[data-placement*='top'] {
    bottom: 0;
    left: 0;
    margin-bottom: -0.9em;
    width: 3em;
    height: 1em;
    &::before {
      border-width: 1em 1.5em 0 1.5em;
      border-color: #00000f transparent transparent transparent;
      filter: drop-shadow(0px 3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &[data-placement*='right'] {
    left: 0;
    margin-left: -0.9em;
    height: 3em;
    width: 1em;
    &::before {
      border-width: 1.5em 1em 1.5em 0;
      border-color: transparent #00000f transparent transparent;
      filter: drop-shadow(-4px 3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &[data-placement*='left'] {
    right: 0;
    margin-right: -0.9em;
    height: 3em;
    width: 1em;
    &::before {
      border-width: 1.5em 0 1.5em 1em;
      border-color: transparent transparent transparent #00000f;
      filter: drop-shadow(4px 3px 3px rgba(20, 20, 20, 0.1));
    }
  }
  &::before {
    content: '';
    margin: auto;
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
  }
`;

const ChildrenContainer = styled.div`
  display: ${props => props.display};
  cursor: help;
`;

const REACT_POPPER_MODIFIERS = [
  {
    name: 'flip',
    options: {
      fallbackPlacements: ['right', 'bottom', 'top'],
      padding: { right: 100 },
    },
  },
];

/**
 * A tooltip to show overlays on hover.
 *
 * Relies on [react-tooltip](https://react-tooltip.netlify.com/) and accepts any
 * of its properties.
 */
class StyledTooltip extends React.Component {
  static propTypes = {
    /** Tooltip place */
    place: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    /** The popup content */
    content: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    /** If using a node children, this defines the parent display type */
    display: PropTypes.string,
    /** The component that will be used as a container for the children */
    childrenContainer: PropTypes.any,
    /** The trigger. Either:
     *  - A render func, that gets passed props to set on the trigger
     *  - A React node, rendered inside an div
     */
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  };

  static defaultProps = {
    type: 'dark',
    place: 'top',
    display: 'inline-block',
  };

  state = { id: null, popperOpen: false }; // We only set `id` on the client to avoid mismatches with SSR

  componentDidMount() {
    this.setState({ id: `tooltip-${uuid()}` });
  }

  handlePopperOpen = () => {
    this.setState({ popperOpen: true });
  };

  handlePopperClose = () => {
    this.setState({ popperOpen: false });
  };

  render() {
    const isMounted = Boolean(this.state.id);
    const triggerProps = isMounted ? { 'data-for': this.state.id, 'data-tip': true } : {};
    return (
      <React.Fragment>
        <Manager>
          <Reference>
            {({ ref }) => (
              <Box
                ref={ref}
                css={{ display: 'inline' }}
                onMouseOver={this.handlePopperOpen}
                onMouseOut={this.handlePopperClose}
              >
                {typeof this.props.children === 'function' ? (
                  this.props.children(triggerProps)
                ) : (
                  <ChildrenContainer as={this.props.childrenContainer} display={this.props.display} {...triggerProps}>
                    {this.props.children}
                  </ChildrenContainer>
                )}
              </Box>
            )}
          </Reference>

          {isMounted && this.state.popperOpen && (
            <Popper placement={this.props.place} modifiers={REACT_POPPER_MODIFIERS}>
              {({ ref, style, placement, arrowProps }) => (
                <StyledTooltipContainer ref={ref} style={style}>
                  {typeof this.props.content === 'function' ? this.props.content() : this.props.content}

                  <Arrow ref={arrowProps.ref} data-placement={placement} style={arrowProps.style} />
                </StyledTooltipContainer>
              )}
            </Popper>
          )}
        </Manager>
      </React.Fragment>
    );
  }
}

export default StyledTooltip;
