import React from 'react';
import { useIntl } from 'react-intl';

import { useToast } from '../../components/ui/useToast';

import { formatErrorMessage } from '../errors';

export const useAsyncCall = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  { useErrorToast = false, defaultData = null } = {},
): {
  loading: boolean;
  call: (...args: Parameters<T>) => Promise<void>;
  callWith: (...args: Parameters<T>) => () => Promise<void>;
  data: Awaited<ReturnType<T>>;
  error: any;
} => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(defaultData);
  const [error, setError] = React.useState();
  const { toast } = useToast();
  const intl = useIntl();

  const callWith =
    (...args) =>
    async () => {
      setLoading(true);
      setError(undefined);
      setData(undefined);

      try {
        const response = await fn(...args);
        setData(response);
      } catch (e) {
        setError(e);
        // eslint-disable-next-line no-console
        console.error(e);
        if (useErrorToast) {
          toast({ variant: 'error', message: formatErrorMessage(intl, e) });
        }
      } finally {
        setLoading(false);
      }
    };

  const call = (...args) => callWith(...args)();

  return { loading, call, callWith, data, error };
};
