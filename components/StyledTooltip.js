import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

const StyledTooltipContainer = styled(ReactTooltip)`
  max-width: 320px;
  z-index: 1000000;
  opacity: 0.96 !important;
  border-radius: 8px;
  box-shadow: 0px 3px 6px 1px rgba(20, 20, 20, 0.08);
  padding: 16px;
  font-size: 12px;
  text-transform: initial;
  white-space: normal;

  &.type-light {
    background: white;
    color: ${props => props.theme.colors.black[700]};
    border: 1px solid rgba(20, 20, 20, 0.08);
  }
`;

const ChildrenContainer = styled.div`
  display: ${props => props.display};
  cursor: help;
`;

/**
 * A tooltip to show overlays on hover.
 *
 * Relies on [react-tooltip](https://react-tooltip.netlify.com/) and accepts any
 * of its properties.
 */
class StyledTooltip extends React.Component {
  static propTypes = {
    /** Tooltip type */
    type: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'light', 'dark']),
    /** Tooltip place */
    place: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
    /** The popup content */
    content: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    /** See react-tooltip */
    delayHide: PropTypes.number,
    /** See react-tooltip */
    delayUpdate: PropTypes.number,
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
    delayHide: 500,
    delayUpdate: 500,
    display: 'inline-block',
  };

  state = { id: null }; // We only set `id` on the client to avoid mismatches with SSR

  componentDidMount() {
    this.setState({ id: `tooltip-${uuid()}` });
  }

  renderContent = () => {
    const { content } = this.props;
    return typeof content === 'function' ? content() : content;
  };

  render() {
    const isMounted = Boolean(this.state.id);
    const triggerProps = isMounted ? { 'data-for': this.state.id, 'data-tip': true } : {};
    return (
      <React.Fragment>
        {typeof this.props.children === 'function' ? (
          this.props.children(triggerProps)
        ) : (
          <ChildrenContainer as={this.props.childrenContainer} display={this.props.display} {...triggerProps}>
            {this.props.children}
          </ChildrenContainer>
        )}
        {isMounted && (
          <StyledTooltipContainer
            id={this.state.id}
            effect="solid"
            delayHide={this.props.delayHide}
            delayUpdate={this.props.delayUpdate}
            place={this.props.place}
            type={this.props.type}
            getContent={this.renderContent}
          />
        )}
      </React.Fragment>
    );
  }
}

export default StyledTooltip;
