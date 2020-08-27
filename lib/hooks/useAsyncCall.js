import React from 'react';

export const useAsyncCall = fn => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState();
  const [error, setError] = React.useState();

  const callWith = (...args) => async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const call = (...args) => callWith(...args)();

  return { loading, call, callWith, data, error };
};
