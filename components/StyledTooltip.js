import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

const StyledTooltipContainer = styled(`div`)`
  max-width: 320px;
  z-index: 1000000;
  opacity: 0.96 !important;
  border-radius: 4px;
  box-shadow: 0px 3px 6px 1px rgba(20, 20, 20, 0.08);
  padding: 12px 16px;
  font-size: 12px;
  text-transform: initial;
  white-space: normal;
  color: white;
  background: #141414;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
`;

const Arrow = styled('div')`
  position: absolute;
  font-size: 8px;
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
      border-color: transparent transparent #141414 transparent;
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
      border-color: #141414 transparent transparent transparent;
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
      border-color: transparent #141414 transparent transparent;
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
      border-color: transparent transparent transparent #141414;
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
  button:disabled {
    pointer-events: none;
  }
`;

const REACT_POPPER_MODIFIERS = [
  {
    name: 'flip',
    options: {
      fallbackPlacements: ['right', 'bottom', 'top'],
      padding: { right: 100 },
    },
  },
  {
    name: 'offset',
    options: {
      offset: ({ placement }) => {
        switch (placement) {
          case 'top':
          case 'bottom':
            return [0, 3];
          default:
            return [];
        }
      },
    },
  },
];

const TooltipContent = ({ place, content, onMouseEnter, onMouseLeave }) => {
  return ReactDOM.createPortal(
    <Popper placement={place} modifiers={REACT_POPPER_MODIFIERS}>
      {({ ref, style, placement, arrowProps }) => (
        <StyledTooltipContainer ref={ref} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          {typeof content === 'function' ? content() : content}
          <Arrow ref={arrowProps.ref} data-placement={placement} style={arrowProps.style} />
        </StyledTooltipContainer>
      )}
    </Popper>,
    document.body,
  );
};

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
    delayHide: PropTypes.number,
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
    delayHide: 500,
    display: 'inline-block',
  };

  state = { id: null, isHovered: false, showPopup: false }; // We only set `id` on the client to avoid mismatches with SSR

  componentDidMount() {
    this.setState({ id: `tooltip-${uuid()}` });
  }

  componentDidUpdate(_, oldState) {
    if (!oldState.isHovered && this.state.isHovered) {
      if (this.closeTimeout) {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }

      this.setState({ showPopup: true });
    } else if (oldState.isHovered && !this.state.isHovered) {
      this.closeTimeout = setTimeout(() => this.setState({ showPopup: false }), this.props.delayHide);
    }
  }

  onMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  onMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  render() {
    const isMounted = Boolean(this.state.id);

    return (
      <React.Fragment>
        <Manager>
          <Reference>
            {({ ref }) =>
              typeof this.props.children === 'function' ? (
                this.props.children({
                  ref: ref,
                  onMouseEnter: this.onMouseEnter,
                  onMouseLeave: this.onMouseLeave,
                })
              ) : (
                <ChildrenContainer
                  ref={ref}
                  as={this.props.childrenContainer}
                  display={this.props.display}
                  onMouseEnter={this.onMouseEnter}
                  onMouseLeave={this.onMouseLeave}
                >
                  {this.props.children}
                </ChildrenContainer>
              )
            }
          </Reference>

          {isMounted && this.state.showPopup && (
            <TooltipContent
              place={this.props.place}
              content={this.props.content}
              onMouseEnter={this.onMouseEnter}
              onMouseLeave={this.onMouseLeave}
            />
          )}
        </Manager>
      </React.Fragment>
    );
  }
}

export default StyledTooltip;
