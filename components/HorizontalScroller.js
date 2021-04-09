import React from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft } from '@styled-icons/fa-solid/ChevronLeft';
import { ChevronRight } from '@styled-icons/fa-solid/ChevronRight';
import themeGet from '@styled-system/theme-get';
import styled from 'styled-components';

import { debounceScroll } from '../lib/ui-utils';
import withViewport from '../lib/withViewport';

/** Main chevrons container, spacing the items properly */
const ChevronsContainer = styled(({ onPrevClick, onNextClick, ...props }) => (
  <div {...props}>
    <ChevronLeft onMouseDown={onPrevClick} disabled={!onPrevClick} />
    <ChevronRight onMouseDown={onNextClick} disabled={!onNextClick} />
  </div>
))`
  display: flex;
  justify-content: space-between;
  color: #dadada;
  user-select: none;
  width: ${props => props.size * 3.5}px;

  svg {
    width: ${props => props.size}px;
    height: ${props => props.size}px;

    &:not([disabled]) {
      color: ${themeGet('colors.primary.500')};

      &:hover {
        cursor: pointer;
        color: ${themeGet('colors.primary.400')};
      }
    }
  }
`;

ChevronsContainer.propTypes = {
  /** Size of a single chevron. Total width (including margins) will be 3.5x this value. */
  size: PropTypes.number,
  /** Called when left chevron is clicked. Set to `undefined` to disable */
  onPrevClick: PropTypes.func,
  /** Called when right chevron is clicked. Set to `undefined` to disable */
  onNextClick: PropTypes.func,
};

ChevronsContainer.defaultProps = {
  size: 14,
};

/**
 * Helper to display a list of horizontally scrollable items, with two little
 * carets to navigate easily.
 */
class HorizontalScroller extends React.PureComponent {
  static propTypes = {
    /**
     * A child render function that takes the following arguments:
     *  - `ref`: A ref to pass to you container
     *  - `Chevrons`: The chevrons to navigate through the list easily. If the list
     *    is not scrollable, nothing will be rendered.
     */
    children: PropTypes.func.isRequired,
    /** Callback to get the scrolled distance when we click on prev/next chevrons */
    getScrollDistance: PropTypes.func,
    /** @ignore from withViewport */
    width: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = { canGoPrev: false, canGoNext: false };
  }

  componentDidMount() {
    if (this.ref.current) {
      this.ref.current.addEventListener('scroll', this.updateScrollInfo);
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

    return this.props.children(this.ref, props =>
      !canGoPrev && !canGoNext ? null : (
        <ChevronsContainer
          onPrevClick={canGoPrev ? this.onPrevClick : undefined}
          onNextClick={canGoNext ? this.onNextClick : undefined}
          {...props}
        />
      ),
    );
  }
}

// We don't use the data from `withViewport`, but we use it to update the
// component when the window's width changes.
export default withViewport(HorizontalScroller, { withWidth: true });
