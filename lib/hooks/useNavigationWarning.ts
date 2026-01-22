import React from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

type useNavigationWarningOpts = {
  enabled?: boolean;
  confirmationMessage?: string;
};

export function useNavigationWarning(opts: useNavigationWarningOpts) {
  const router = useRouter();
  const intl = useIntl();
  const message = React.useMemo(
    () =>
      opts.confirmationMessage ||
      intl.formatMessage({
        id: 'WarningUnsavedChanges',
        defaultMessage: 'You have unsaved changes. Are you sure you want to leave this page?',
      }),
    [intl, opts.confirmationMessage],
  );

  const confirmNavigation = React.useCallback(() => {
    if (!opts.enabled) {
      return true;
    }
    return confirm(message);
  }, [opts.enabled, message]);

  React.useEffect(() => {
    function warnOnUnload(e) {
      if (opts.enabled) {
        e.preventDefault();
        e.returnValue = message;
      }
      return true;
    }

    function warnOnRouteChangeStart(url, { shallow }) {
      if (opts.enabled && !shallow && !url.startsWith('/signin')) {
        if (!confirm(message)) {
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
  }, [router, opts.enabled, message]);

  return [confirmNavigation];
}
