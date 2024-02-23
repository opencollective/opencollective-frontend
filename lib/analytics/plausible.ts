import type { AnalyticsEvent } from './events';
import type { AnalyticsProperty } from './properties';

declare global {
  interface Window {
    plausible: (
      event: string,
      options: {
        props: Record<string, string | boolean | number>;
      },
    ) => void;
  }
}

type TrackOptions = {
  props: Record<AnalyticsProperty, string | number | boolean>;
};

export function track(event: AnalyticsEvent, options?: TrackOptions) {
  if (window.plausible) {
    window.plausible(event, options);
  }
}
