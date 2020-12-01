import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import useEscapeKey from '../lib/hooks/useKeyboardKey';
import useGlobalBlur from '../lib/hooks/useGlobalBlur';

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
`;

const Arrow = styled('div')`
  position: absolute;
  font-size: 8px;
  width: 3em;
  height: 3em;
  &[data-placement*='bottom'] {
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
  &[data-placement*='top'] {
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
  &[data-placement*='right'] {
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
  &[data-placement*='left'] {
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
  button:disabled {
    pointer-events: none;
  }
`;

const InnerMenuContainer = styled.div`
  outline: none;
`;

const TooltipContent = ({ place, content, onClose }) => {
  const innerRef = React.useRef();

  // Close on click outside
  useGlobalBlur(innerRef, isOutside => {
    if (isOutside) {
      onClose();
    }
  });

  // Close when Escape is pressed
  useEscapeKey({ callback: onClose, keyName: 'Escape', keyAbb: 'Esc', keyCode: 27 });

  // Focus menu when opening
  React.useEffect(() => {
    innerRef.current.focus();
  });

  return ReactDOM.createPortal(
    <Popper placement={place}>
      {({ ref, style, placement, arrowProps }) => (
        <StyledMenuPopoverContainer ref={ref} style={style}>
          <InnerMenuContainer ref={innerRef} tabIndex="-1">
            {typeof content === 'function' ? content() : content}
            <Arrow ref={arrowProps.ref} data-placement={placement} style={arrowProps.style} />
          </InnerMenuContainer>
        </StyledMenuPopoverContainer>
      )}
    </Popper>,
    document.body,
  );
};

class MenuPopover extends React.Component {
  static propTypes = {
    /** Tooltip place */
    place: PropTypes.oneOf([
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

  state = { id: null, showMenu: false }; // We only set `id` on the client to avoid mismatches with SSR

  componentDidMount() {
    this.setState({ id: `menu-popover-${uuid()}` });
  }

  hideMenu = () => {
    this.setState({ showMenu: false });
  };

  toggleMenu = () => {
    this.setState(state => ({ showMenu: !state.showMenu }));
  };

  render() {
    const isMounted = Boolean(this.state.id);

    return (
      <React.Fragment>
        <Manager>
          <Reference>
            {({ ref }) =>
              typeof this.props.children === 'function' ? (
                this.props.children({ ref: ref })
              ) : (
                <ChildrenContainer
                  ref={ref}
                  as={this.props.childrenContainer}
                  display={this.props.display}
                  onClick={this.toggleMenu}
                >
                  {this.props.children}
                </ChildrenContainer>
              )
            }
          </Reference>

          {isMounted && this.state.showMenu && (
            <TooltipContent place={this.props.place} content={this.props.content} onClose={this.hideMenu} />
          )}
        </Manager>
      </React.Fragment>
    );
  }
}

export default MenuPopover;
