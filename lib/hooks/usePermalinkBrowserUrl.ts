import React from 'react';

import { getPermalinkPath } from '../url-helpers';

/**
 * While `publicId` is set, cosmetically swap the browser's address bar to the entity permalink
 * (`/permalink/{publicId}`) so the URL can be copied/shared, then restore the previous URL once it
 * becomes falsy again or the component unmounts.
 *
 */
export function usePermalinkBrowserUrl(publicId: string | null | undefined) {
  const permalinkUrl = publicId ? getPermalinkPath(publicId) : null;
  const returnUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !permalinkUrl) {
      return undefined;
    }

    const getBrowserUrl = () => window.location.pathname + window.location.search + window.location.hash;

    if (getBrowserUrl() !== permalinkUrl) {
      returnUrlRef.current = getBrowserUrl();
      window.history.replaceState(window.history.state, '', permalinkUrl);
    }

    return () => {
      if (returnUrlRef.current && getBrowserUrl() === permalinkUrl) {
        window.history.replaceState(window.history.state, '', returnUrlRef.current);
      }
      returnUrlRef.current = null;
    };
  }, [permalinkUrl]);
}
