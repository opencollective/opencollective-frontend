import React from 'react';
import { debounce, findLastIndex, isEqual, zipObject } from 'lodash';

import breakpoints from './theme/breakpoints';
import { emToPx } from './theme/helpers';

/**
 * Defines all the breakpoints names as passed by `withViewport`
 */
export const VIEWPORTS = {
  XSMALL: 'XSMALL',
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  UNKNOWN: 'UNKNOWN',
};

// Please keep the same length for these two arrays
export const BREAKPOINTS_NAMES = [VIEWPORTS.XSMALL, VIEWPORTS.SMALL, VIEWPORTS.MEDIUM, VIEWPORTS.LARGE];
export const BREAKPOINTS_WIDTHS = BREAKPOINTS_NAMES.map((_, idx) => emToPx(breakpoints[idx]));
export const BREAKPOINTS = zipObject(BREAKPOINTS_NAMES, BREAKPOINTS_WIDTHS);

/**
 * Helper to check if a viewport is superior or equal to another one.
 * Always returns false for `UNKNOWN`
 *
 * @param {VIEWPORTS} viewport
 * @param {VIEWPORTS} breakpointName
 */
export const viewportIsAbove = (viewport, breakpointName) => {
  return BREAKPOINTS_NAMES.indexOf(viewport) >= BREAKPOINTS_NAMES.indexOf(breakpointName);
};

/**
 * Returns true if viewport is not `UNKNOWN` and is >= desktop.
 *
 * @param {VIEWPORTS} viewport
 */
export const isDesktopOrAbove = viewport => {
  return BREAKPOINTS_NAMES.indexOf(viewport) >= BREAKPOINTS_NAMES.indexOf(VIEWPORTS.MEDIUM);
};

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
 *  - `defaultViewport` (default: UNKNOWN) - if detection fails, fallback on this screen size
 */
const withViewport = (ChildComponent, options) => {
  const { withWidth, withHeight, defaultViewport = VIEWPORTS.UNKNOWN } = options || {};
  const buildState = getStateBuilder(withWidth || false, withHeight || false);

  return class Viewport extends React.Component {
    // Default height usually doesn't matters much, so we use the width as default
    constructor(props) {
      super(props);

      // Always initialize without `window`, to make sure SSR and client render are the same
      // Could trigger "DOM not matching" errors otherwise
      this.state = buildState(
        BREAKPOINTS[defaultViewport] || BREAKPOINTS_WIDTHS[0],
        BREAKPOINTS[defaultViewport] || BREAKPOINTS_WIDTHS[0],
        defaultViewport,
      );
    }

    componentDidMount() {
      this.doResize();
      this.onResize = debounce(this.doResize, 500, { maxWait: 300 });
      window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.onResize);
    }

    doResize = () => {
      const viewport = getViewportFromWidth(window.innerWidth);
      const state = buildState(window.innerWidth, window.innerHeight, viewport);
      if (!isEqual(this.state, state)) {
        this.setState(state);
      }
    };

    render() {
      return <ChildComponent {...this.state} {...this.props} />;
    }
  };
};

export default withViewport;
