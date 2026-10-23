import React from 'react';
import { useIntl } from 'react-intl';

import { useToast } from '../../components/ui/useToast';

import { formatErrorMessage, getErrorFromGraphqlException } from '../errors';

export const useAsyncCall = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  { useErrorToast = false, defaultData = null } = {},
): {
  loading: boolean;
  call: (...args: Parameters<T>) => Promise<void>;
  callWith: (...args: Parameters<T>) => () => Promise<void>;
  data: Awaited<ReturnType<T>>;
  error?: Error;
} => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(defaultData);
  const [error, setError] = React.useState();
  const { toast } = useToast();
  const intl = useIntl();

  // Keep the latest `fn`/options in refs so `call`/`callWith` can keep a stable identity across
  // renders (callers may depend on them, e.g. in effect dependency arrays). Update them after
  // commit so an interrupted render cannot leak uncommitted values into a call.
  const fnRef = React.useRef(fn);
  const toastRef = React.useRef(toast);
  const intlRef = React.useRef(intl);
  const useErrorToastRef = React.useRef(useErrorToast);
  const requestIdRef = React.useRef(0);

  React.useLayoutEffect(() => {
    fnRef.current = fn;
    toastRef.current = toast;
    intlRef.current = intl;
    useErrorToastRef.current = useErrorToast;
  });

  const callWith = React.useCallback(
    (...args: Parameters<T>) =>
      async () => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(undefined);
        setData(undefined);

        try {
          const response = await fnRef.current(...args);
          if (requestId === requestIdRef.current) {
            setData(response);
          }
        } catch (e) {
          if (requestId === requestIdRef.current) {
            setError(e);
            // eslint-disable-next-line no-console
            console.error(e);
            if (useErrorToastRef.current) {
              toastRef.current({
                variant: 'error',
                message: formatErrorMessage(intlRef.current, getErrorFromGraphqlException(e)),
              });
            }
          }
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        }
      },
    [],
  );

  const call = React.useCallback((...args: Parameters<T>) => callWith(...args)(), [callWith]);

  return { loading, call, callWith, data, error };
};
