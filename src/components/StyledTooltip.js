import React, { Component, createRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Container from './Container';
import StyledCard from './StyledCard';

class Popup extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  constructor(props) {
    super(props);
    this.ref = createRef();
    this.state = {
      display: false,
      position: { bottom: 20, left: -160 },
    };
  }

  componentDidMount() {
    const containerRect = this.ref.current.getBoundingClientRect();
    const { bottom, height, top, width } = containerRect;
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
    if (containerRect.right + width >= document.body.clientWidth) {
      nextX = { left: document.body.clientWidth - (containerRect.right + width) };
    }

    this.setState({ display: true, position: { ...nextX, ...nextY } });
  }

  render() {
    const { children } = this.props;
    const { display, position } = this.state;
    return (
      <Container role="tooltip" position="absolute" {...position} onClick={this.onClick}>
        <StyledCard
          borderColor="black.900"
          bg="black.transparent.90"
          color="white.full"
          maxWidth={280}
          p={3}
          ref={this.ref}
          style={{ opacity: display ? 1 : 0 }}
          width="max-content"
        >
          {children}
        </StyledCard>
      </Container>
    );
  }
}

const MainContainer = styled.div`
  position: relative;
  display: inline-block;
  &:focus {
    outline: none;

    [data-toggle='tooltip'] {
      outline: 1px dashed lightgrey;
    }
  }
`;

class StyledTooltip extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isDisplayed: false };
    this.ref = React.createRef();
  }

  onMouseEnter = () => {
    this.setState({ isDisplayed: true });
  };

  onMouseLeave = () => {
    if (!this.state.isFocused) {
      this.setState({ isDisplayed: false });
    }
  };

  onBlur = e => {
    // Ignore blur event if new target is self or a children
    if (e.relatedTarget !== this.ref.current && !this.ref.current.contains(e.relatedTarget)) {
      this.setState({ isDisplayed: false, isFocused: false });
    }
  };

  onFocus = () => {
    this.setState({ isDisplayed: true, isFocused: true });
  };

  render() {
    const { content, children } = this.props;
    return (
      <MainContainer
        tabIndex="0"
        ref={this.ref}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
        {this.state.isDisplayed && <Popup>{content()}</Popup>}
        <div data-toggle="tooltip">{children}</div>
      </MainContainer>
    );
  }
}

StyledTooltip.propTypes = {
  /** Child component that triggers tooltip */
  children: PropTypes.node,
  /** A function to render the content to display in the tooltip */
  content: PropTypes.func.isRequired,
};

export default StyledTooltip;
