import React from 'react';
import PropTypes from 'prop-types';
import { ArrowBack } from '@styled-icons/material/ArrowBack';
import { ArrowForward } from '@styled-icons/material/ArrowForward';
import styled, { css } from 'styled-components';

import { debounceScroll } from '../lib/ui-utils';
import withViewport from '../lib/withViewport';

import Container from './Container';
import { Flex } from './Grid';
import StyledRoundButton from './StyledRoundButton';

const RefContainer = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  max-width: 100%;
  ${props =>
    props.hideScrollbar &&
    css`
      scrollbar-width: none;
      -ms-overflow-style: none;
      overflow: -moz-scrollbars-none; /** For older firefox */
      &::-webkit-scrollbar {
        display: none;
      }
    `}
`;

const ControlsContainer = styled(Flex)`
  z-index: 10;
  position: absolute;
  top: ${props => (props.controlsTopPosition ? `${props.controlsTopPosition}%` : '50%')};
  pointer-events: none;
  justify-content: space-between;
  width: 100%;
`;

const ArrowContainer = styled(StyledRoundButton)`
  transition: opacity 0.25s ease-in, visibility 0.25s;
  visibility: ${props => (props.isVisible ? 'visible' : 'hidden')};
  opacity: ${props => (props.isVisible ? '1' : '0')};
  pointer-events: auto;

  svg {
    height: 40px;
    padding 7px;
  }
`;

/**
 * Helper to display a list of horizontally scrollable items, with two little
 * carets to navigate easily.
 */
class HorizontalScroller extends React.PureComponent {
  static propTypes = {
    /* Children component */
    children: PropTypes.node.isRequired,
    /** Container component where the list (children) will be inserted */
    container: PropTypes.elementType,
    /** Passed to `container` */
    containerProps: PropTypes.object,
    /** Callback to get the scrolled distance when we click on prev/next controllers */
    getScrollDistance: PropTypes.func,
    /** @ignore from withViewport */
    width: PropTypes.number,
    /** Set the top position of the arrows. Defaults 50% */
    controlsTopPosition: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = { canGoPrev: false, canGoNext: false };
  }

  componentDidMount() {
    if (this.ref.current) {
      this.ref.current.addEventListener('scroll', this.updateScrollInfo, { passive: true });
      this.updateScrollInfo();
    }
  }

  componentDidUpdate(oldProps) {
    if (oldProps.width !== this.props.width) {
      this.updateScrollInfo();
    }
  }

  componentWillUnmount() {
    if (this.ref.current) {
      this.ref.current.removeEventListener('scroll', this.updateScrollInfo);
    }
  }

  updateScrollInfo = debounceScroll(() => {
    if (!this.ref.current) {
      return;
    }

    const { offsetWidth, scrollLeft, scrollWidth } = this.ref.current;

    this.setState({
      canGoPrev: scrollLeft > 0,
      canGoNext: scrollLeft + offsetWidth < scrollWidth,
    });
  });

  UNSAFE_componentWillReceiveProps() {
    this.setState({
      canGoNext: false,
    });
  }

  // Manually move scroll. We don't need to check for limits here because browsers
  // already cap the value. See https://developer.mozilla.org/en/docs/Web/API/Element/scrollLeft:
  // > scrollLeft can be specified as any integer value. However:
  // > - If the element can't be scrolled (e.g., it has no overflow), scrollLeft is set to 0.
  // > - If specified as a value less than 0 (greater than 0 for right-to-left elements), scrollLeft is set to 0.
  // > - If specified as a value greater than the maximum that the content can be scrolled, scrollLeft is set to the maximum.
  onPrevClick = () => {
    if (this.ref.current) {
      this.ref.current.scrollLeft -= this.getScrollDistance();
    }
  };

  onNextClick = () => {
    if (this.ref.current) {
      this.ref.current.scrollLeft += this.getScrollDistance();
    }
  };

  getScrollDistance() {
    const offsetWidth = this.ref.current.offsetWidth;
    if (this.props.getScrollDistance) {
      return this.props.getScrollDistance(offsetWidth);
    } else {
      // Default behavior: scroll by 75% of the full width
      const scrollPercentage = 0.75;
      return scrollPercentage * offsetWidth;
    }
  }

  render() {
    const { canGoPrev, canGoNext } = this.state;

    return (
      <Container position="relative">
        <ControlsContainer px={[2, null, 5]} controlsTopPosition={this.props.controlsTopPosition}>
          <ArrowContainer isVisible={canGoPrev}>
            <ArrowBack onMouseDown={canGoPrev ? this.onPrevClick : undefined} />
          </ArrowContainer>
          <ArrowContainer isVisible={canGoNext}>
            <ArrowForward onMouseDown={canGoNext ? this.onNextClick : undefined} />
          </ArrowContainer>
        </ControlsContainer>
        <RefContainer {...this.props.containerProps} as={this.props.container} ref={this.ref}>
          {this.props.children}
        </RefContainer>
      </Container>
    );
  }
}

// We don't use the data from `withViewport`, but we use it to update the
// component when the window's width changes.
export default withViewport(HorizontalScroller, { withWidth: true });
