import { AnalyticsEvent } from './events';
import { AnalyticsProperty } from './properties';

declare global {
  interface Window {
    plausible: (
      event: string,
      options: {
        u?: string;
        props?: Record<string, string | boolean | number>;
      },
    ) => void;
  }
}

type TrackOptions = {
  props?: Record<AnalyticsProperty, string | number | boolean>;
};

export function track(event: AnalyticsEvent | 'pageview', options: TrackOptions = {}) {
  const location = normalizeLocation(window.location.href);

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('plausible event', event, location, JSON.stringify(options));
  }
  if (window.plausible) {
    window.plausible(event, Object.assign(options, { u: location }));
  }
}

export function normalizeLocation(href: string): string {
  const url = new URL(href);
  const pathname = url.pathname;

  if (pathname.startsWith('/dashboard/')) {
    url.pathname = pathname.replace(/(\/dashboard\/)([^/]+)(.*)/, '$1[slug]$3');
  }

  return url.href;
}

// Adapted from https://github.com/plausible/analytics/blob/master/tracker/src/plausible.js to use with manual mode
// See https://plausible.io/docs/custom-locations
(function initPlausible() {
  let lastLocationPathName;

  function trackPageView() {
    if (lastLocationPathName === location.pathname) {
      return;
    }
    lastLocationPathName = location.pathname;
    track('pageview');
  }

  if (typeof window !== 'undefined' && window.history.pushState) {
    const originalPushState = window.history['pushState'];
    window.history.pushState = function () {
      originalPushState.apply(this, arguments);
      trackPageView();
    };
    window.addEventListener('popstate', trackPageView);
  }

  if (typeof window !== 'undefined') {
    trackPageView();
  }
})();
