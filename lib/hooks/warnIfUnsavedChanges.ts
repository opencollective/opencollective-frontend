/**
 * Same as `components/WarnIfUnsavedChanges.js` but as a hook.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { defineMessage, useIntl } from 'react-intl';

import { IgnorableError } from '../errors';

const confirmMessage = defineMessage({
  id: 'WarningUnsavedChanges',
  defaultMessage: 'You have unsaved changes. Are you sure you want to leave this page?',
});

/**
 * A hook to warn users if they try to leave with unsaved data. Just set
 * `hasUnsavedChanges` to true when this is the case and this hook will block any
 * attempt to leave the page.
 */
export default function useWarnIfUnsavedChanges(hasUnsavedChanges) {
  const router = useRouter();
  const intl = useIntl();

  useEffect(() => {
    /** Triggered when closing tabs */
    const handleRouteChangeStart = () => {
      if (hasUnsavedChanges && !confirm(intl.formatMessage(confirmMessage))) {
        router.events.emit('routeChangeError'); // For NProgress to stop the loading indicator
        throw new IgnorableError('Abort page navigation');
      }
    };

    /**
     * NextJS doesn't yet provide a nice way to abort page loading. We're stuck with throwing
     * an error, which will produce an error in dev but should work fine in prod.
     */
    const handleBeforeUnload = e => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        const message = intl.formatMessage(confirmMessage);
        e.returnValue = message;
        return message;
      }
    };

    // Bind events
    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChangeStart);
    // Unbind events when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, []);
}
