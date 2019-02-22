import { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import { withState } from 'recompose';

import Container from './Container';
import StyledCard from './StyledCard';

const addShowState = withState('show', 'setState', false);

class Popup extends Component {
  state = {
    display: false,
    position: { bottom: 20, left: -160 },
  };
  ref = createRef();

  componentDidMount() {
    // need to wait a tick to get access to the rendered container node
    setTimeout(() => {
      const containerRect = this.props.containerRef.current.getBoundingClientRect();
      const { bottom, height, top, width } = this.ref.current.getBoundingClientRect();
      const centerX = -(width / 2);
      const centerY = -(height / 2);

      let nextX = width / 2 > containerRect.left ? { left: 0 } : { left: centerX };
      let nextY = { bottom: 20 };

      // popup is too tall
      if (top < 0) {
        // popup would be too low
        // display centered on the y-axis, next to the container
        if (containerRect.bottom + bottom > height - containerRect.height - 5) {
          nextY = { bottom: centerY + containerRect.height / 2 };
          nextX = { left: containerRect.width + 10 };
        } else {
          // diplay popup below container
          nextY = { top: containerRect.height + 5 };
        }
      }

      // popup will show too far right
      if (containerRect.right + width > document.body.clientWidth) {
        nextX = { right: -containerRect.width };
      }

      this.setState({ display: true, position: { ...nextX, ...nextY } });
    }, 0);
  }

  render() {
    const { children, ...styleProps } = this.props;
    const { display, position } = this.state;
    return (
      <Container role="tooltip" position="absolute" {...position} style={{ pointerEvents: 'none' }}>
        <StyledCard
          borderColor="black.900"
          bg="black.transparent.80"
          color="white.full"
          maxWidth={280}
          p={3}
          ref={this.ref}
          style={{ opacity: display ? 1 : 0 }}
          width="max-content"
          {...styleProps}
        >
          {children}
        </StyledCard>
      </Container>
    );
  }
}

const StyledTooltip = addShowState(({ children, content, show, setState, ...styleProps }) => {
  const containerRef = createRef();

  return (
    <Container position="relative" ref={containerRef} display="inline-block">
      {show && (
        <Popup containerRef={containerRef} {...styleProps}>
          {content}
        </Popup>
      )}
      {children({
        onBlur: () => setState(false),
        onClick: () => setState(state => !state),
        onFocus: () => setState(true),
        onMouseEnter: () => setState(true),
        onMouseLeave: () => setState(false),
        tabIndex: 0,
      })}
    </Container>
  );
});

StyledTooltip.propTypes = {
  /**
   * Function to render child component that triggers tooltip
   * @param {Object} props - properties used to control triggering of the tooltip
   * @param {function} props.onBlur - hides the tooltip
   * @param {function} props.onClick - toggles showing the tooltip
   * @param {function} props.onFocus - shows the tooltip
   * @param {function} props.onMouseEnter - shows the tooltip
   * @param {function} props.onMouseLeave - hides the tooltip
   * @param {number} props.tabIndex - allows focusing on the child element
   */
  children: PropTypes.func.isRequired,
  /** content to display in the tooltip */
  content: PropTypes.node.isRequired,
};

export default StyledTooltip;
