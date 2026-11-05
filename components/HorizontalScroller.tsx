import React from 'react';
import { ArrowBack } from '@styled-icons/material/ArrowBack';
import { ArrowForward } from '@styled-icons/material/ArrowForward';
import styled, { css } from 'styled-components';

import { debounceScroll } from '../lib/ui-utils';
import withViewport from '../lib/withViewport';

import Container from './Container';
import { Flex } from './Grid';
import StyledRoundButton from './StyledRoundButton';

type RefContainerProps = {
  hideScrollbar?: boolean;
  /** Forwarded to the custom `container` component, which uses it to disable scroll snapping */
  disableScrollSnapping?: boolean;
};

const RefContainer = styled.div<RefContainerProps>`
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

const ControlsContainer = styled(Flex)<{ controlsTopPosition?: number }>`
  z-index: 10;
  position: absolute;
  top: ${props => (props.controlsTopPosition ? `${props.controlsTopPosition}%` : '50%')};
  pointer-events: none;
  justify-content: space-between;
  width: 100%;
`;

const ArrowContainer = styled(StyledRoundButton)<{ isVisible?: boolean }>`
  transition: opacity 0.25s ease-in, visibility 0.25s;
  visibility: ${props => (props.isVisible ? 'visible' : 'hidden')};
  opacity: ${props => (props.isVisible ? '1' : '0')};
  pointer-events: auto;

  svg {
    height: 40px;
    padding 7px;
  }
`;

type HorizontalScrollerProps = {
  /* Children component */
  children: React.ReactNode;
  /** Container component where the list (children) will be inserted */
  container?: React.ElementType;
  /** Passed to `container` */
  containerProps?: React.ComponentProps<typeof RefContainer>;
  /** Callback to get the scrolled distance when we click on prev/next controllers */
  getScrollDistance?: (offsetWidth: number) => number;
  /** @ignore from withViewport */
  width?: number;
  /** Set the top position of the arrows. Defaults 50% */
  controlsTopPosition?: number;
};

type HorizontalScrollerState = {
  canGoPrev: boolean;
  canGoNext: boolean;
};

/**
 * Helper to display a list of horizontally scrollable items, with two little
 * carets to navigate easily.
 */
class HorizontalScroller extends React.PureComponent<HorizontalScrollerProps, HorizontalScrollerState> {
  constructor(props: HorizontalScrollerProps) {
    super(props);
    this.ref = React.createRef<HTMLDivElement>();
    this.state = { canGoPrev: false, canGoNext: false };
  }

  componentDidMount() {
    if (this.ref.current) {
      this.ref.current.addEventListener('scroll', this.updateScrollInfo, { passive: true });
      this.updateScrollInfo();
    }
  }

  componentDidUpdate() {
    this.updateScrollInfo();
  }

  componentWillUnmount() {
    if (this.ref.current) {
      this.ref.current.removeEventListener('scroll', this.updateScrollInfo);
    }
  }

  ref: React.RefObject<HTMLDivElement>;

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
