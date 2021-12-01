import React from 'react';
import { useIntl } from 'react-intl';

import { TOAST_TYPE, useToasts } from '../../components/ToastProvider';

import { formatErrorMessage } from '../errors';

export const useAsyncCall = (fn, { useErrorToast = false } = {}) => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState();
  const [error, setError] = React.useState();
  const { addToast } = useToasts();
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
          addToast({ type: TOAST_TYPE.ERROR, message: formatErrorMessage(intl, e) });
        }
      } finally {
        setLoading(false);
      }
    };

  const call = (...args) => callWith(...args)();

  return { loading, call, callWith, data, error };
};
