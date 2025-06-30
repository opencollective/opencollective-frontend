import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

import Loading from './Loading';

const Redirect = ({ to }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(to);
  }, [to]);

  return <Loading />;
};

export default Redirect;
