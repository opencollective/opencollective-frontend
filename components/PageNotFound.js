import React from 'react';
import PropTypes from 'prop-types';

import { generateNotFoundError } from '../lib/errors';

import ErrorPage from './ErrorPage';

const PageNotFound = ({ searchTerm }) => {
  return (
    <div id="__page_404_not_found__">
      <ErrorPage error={generateNotFoundError(searchTerm, true)} log={false} />
    </div>
  );
};

PageNotFound.propTypes = {
  searchTerm: PropTypes.string,
};

export default PageNotFound;
