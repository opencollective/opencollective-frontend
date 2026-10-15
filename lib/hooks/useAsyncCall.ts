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
  // renders (callers may depend on them, e.g. in effect dependency arrays).
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const intlRef = React.useRef(intl);
  intlRef.current = intl;
  const useErrorToastRef = React.useRef(useErrorToast);
  useErrorToastRef.current = useErrorToast;

  const callWith = React.useCallback(
    (...args: Parameters<T>) =>
      async () => {
        setLoading(true);
        setError(undefined);
        setData(undefined);

        try {
          const response = await fnRef.current(...args);
          setData(response);
        } catch (e) {
          setError(e);
          // eslint-disable-next-line no-console
          console.error(e);
          if (useErrorToastRef.current) {
            toastRef.current({
              variant: 'error',
              message: formatErrorMessage(intlRef.current, getErrorFromGraphqlException(e)),
            });
          }
        } finally {
          setLoading(false);
        }
      },
    [],
  );

  const call = React.useCallback((...args: Parameters<T>) => callWith(...args)(), [callWith]);

  return { loading, call, callWith, data, error };
};
