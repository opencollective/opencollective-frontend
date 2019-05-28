import React from 'react';
import { debounce, findLastIndex, zipObject } from 'lodash';

/**
 * Defines all the breakpoints names as passed by `withViewport`
 */
export const VIEWPORTS = {
  MOBILE: 'MOBILE',
  TABLET: 'TABLET',
  DESKTOP: 'DESKTOP',
  WIDESCREEN: 'WIDESCREEN',
  UNKNOWN: 'UNKNOWN',
};

// Please keep the same length for these two arrays
export const BREAKPOINTS_NAMES = [VIEWPORTS.MOBILE, VIEWPORTS.TABLET, VIEWPORTS.DESKTOP, VIEWPORTS.WIDESCREEN];
export const BREAKPOINTS_WIDTHS = [640, 832, 1024, 1408];
export const BREAKPOINTS = zipObject(BREAKPOINTS_NAMES, BREAKPOINTS_WIDTHS);

/** Returns the name of the viewport (see `BREAKPOINTS_NAMES`) */
export const getViewportFromWidth = width => {
  const breakpointIdx = findLastIndex(BREAKPOINTS_WIDTHS, b => width >= b);
  return breakpointIdx === -1 ? BREAKPOINTS_NAMES[0] : BREAKPOINTS_NAMES[breakpointIdx];
};

/** Function to build component's state */
const getStateBuilder = (withWidth, withHeight) => {
  if (withWidth && withHeight) {
    return (width, height, viewport) => ({ width, height, viewport });
  } else if (withWidth) {
    return (width, height, viewport) => ({ width, viewport });
  } else if (withHeight) {
    return (width, height, viewport) => ({ height, viewport });
  } else {
    return (width, height, viewport) => ({ viewport });
  }
};

/**
 * Watch window resize and provide info about the screen size. Has default to
 * properly render on SSR (customizable with `defaultViewport`).
 *
 * @param {ReactNode} ChildComponent
 * @param {object} options
 *  - `withWidth` (default: false) - pass the width of the window
 *  - `withHeight` (default: false) - pass the height of the window
 *  - `debounceInterval` (default: 200) - maximum time to wait before refreshing the props
 *  - `defaultViewport` (default: UNKNOWN) - if detection fails, fallback on this screen size
 */
const withViewport = (ChildComponent, options) => {
  const { withWidth, withHeight, debounceInterval, defaultViewport = VIEWPORTS.UNKNOWN } = options || {};
  const buildState = getStateBuilder(withWidth || false, withHeight || false);

  return class Viewport extends React.PureComponent {
    // Default height usually doesn't matters much, so we use the width as default
    state = buildState(
      BREAKPOINTS[defaultViewport] || BREAKPOINTS_WIDTHS[0],
      BREAKPOINTS[defaultViewport] || BREAKPOINTS_WIDTHS[0],
      defaultViewport,
    );

    componentDidMount() {
      this.onResize();
      window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.onResize);
    }

    /** Must only be called on client side */
    onResize = debounce(() => {
      const viewport = getViewportFromWidth(window.innerWidth);
      const state = buildState(window.innerWidth, window.innerHeight, viewport);
      this.setState(state);
    }, debounceInterval || 200);

    render() {
      return <ChildComponent {...this.state} {...this.props} />;
    }
  };
};

export default withViewport;
