import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/router';

import Loading from './Loading';

const Redirect = ({ to }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(to);
  }, [to]);

  return <Loading />;
};

Redirect.propTypes = {
  to: PropTypes.string.isRequired,
};

export default Redirect;
