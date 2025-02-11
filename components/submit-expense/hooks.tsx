import React from 'react';
import { useRouter } from 'next/router';

type useNavigationWarningOpts = {
  enabled?: boolean;
  confirmationMessage: any;
};

export function useNavigationWarning(opts: useNavigationWarningOpts) {
  const router = useRouter();

  const confirmNavigation = React.useCallback(() => {
    if (!opts.enabled) {
      return true;
    }
    return confirm(opts.confirmationMessage);
  }, [opts.enabled, opts.confirmationMessage]);

  React.useEffect(() => {
    function warnOnUnload(e) {
      if (opts.enabled) {
        e.preventDefault();
        e.returnValue = opts.confirmationMessage;
      }
      return true;
    }

    function warnOnRouteChangeStart(url, { shallow }) {
      if (opts.enabled && !shallow && !url.startsWith('/signin')) {
        if (!confirm(opts.confirmationMessage)) {
          router.events.emit('routeChangeError');
          throw 'abort navigation';
        }
      }
    }

    window.addEventListener('beforeunload', warnOnUnload);
    router.events.on('routeChangeStart', warnOnRouteChangeStart);
    return () => {
      window.removeEventListener('beforeunload', warnOnUnload);
      router.events.off('routeChangeStart', warnOnRouteChangeStart);
    };
  }, [router, opts.enabled, opts.confirmationMessage]);

  return [confirmNavigation];
}
