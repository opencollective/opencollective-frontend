import { AnalyticsEvent } from './events';
import { AnalyticsProperty } from './properties';

declare global {
  interface Window {
    plausible?: {
      (
        event: string,
        options: {
          u?: string;
          props?: Record<string, string | boolean | number>;
        },
      ): void;
      q?: any[];
    };
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
    url.pathname = pathname.replace(/(\/dashboard\/)[^/]+(.*)/, '$1[slug]$2');
  } else if (pathname.startsWith('/signin/') && !pathname.startsWith('/signin/sent')) {
    url.pathname = pathname.replace(/(\/signin\/)[^/]+(.*)/, '$1[token]$2');
  } else if (pathname.startsWith('/reset-password/')) {
    url.pathname = pathname.replace(/(\/reset-password\/)[^/]+(.*)/, '$1[token]$2');
  } else if (pathname.startsWith('/confirm/email/')) {
    url.pathname = pathname.replace(/(\/confirm\/email\/)[^/]+(.*)/, '$1[token]$2');
  } else if (pathname.startsWith('/confirm/guest/')) {
    url.pathname = pathname.replace(/(\/confirm\/guest\/)[^/]+(.*)/, '$1[token]$2');
  } else if (pathname.startsWith('/email/unsubscribe/')) {
    url.pathname = pathname.replace(
      /(\/email\/unsubscribe\/)[^/]+\/[^/]+\/([^/]+)\/[^/]+(.*)/,
      '$1[email]/[slug]/$2/[token]$3',
    );
  } else if (pathname.match(/\/[^/]+\/redeem\/.*/)) {
    url.pathname = pathname.replace(/\/[^/]+\/redeem\/[^/]+(.*)/, '/[slug]/redeem/[code]$1');
  } else if (pathname.startsWith('/redeem/')) {
    url.pathname = pathname.replace(/\/redeem\/[^/]+(.*)/, '/redeem/[code]$1');
  } else if (pathname.match(/\/[^/]+\/redeemed\/.*/)) {
    url.pathname = pathname.replace(/\/[^/]+\/redeemed\/[^/]+(.*)/, '/[slug]/redeemed/[code]$1');
  } else if (pathname.startsWith('/redeemed/')) {
    url.pathname = pathname.replace(/\/redeemed\/[^/]+(.*)/, '/redeemed/[code]$1');
  }

  return url.href;
}

// Adapted from https://github.com/plausible/analytics/blob/master/tracker/src/plausible.js to use with manual mode
// See https://plausible.io/docs/custom-locations
(function initPlausible() {
  if (typeof window !== 'undefined') {
    window.plausible =
      window.plausible ||
      function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
  }

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
