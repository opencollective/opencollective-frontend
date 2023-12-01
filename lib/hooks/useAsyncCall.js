import React from 'react';
import { useIntl } from 'react-intl';

import { useToast } from '../../components/ui/useToast';

import { formatErrorMessage } from '../errors';

export const useAsyncCall = (fn, { useErrorToast = false, defaultData = null } = {}) => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(defaultData);
  const [error, setError] = React.useState();
  const { toast } = useToast();
  const intl = useIntl();

  const callWith =
    (...args) =>
    async () => {
      setLoading(true);
      setError();
      setData();
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
