import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Button from './Button';

const NotFound = ({ slug }) => {
  return (
    <div className="NotFound">
      <style jsx>
        {`
          h1 {
            text-align: center;
          }
          .shrug {
            font-size: 3.6rem;
            text-align: center;
            color: #3385ff;
          }
          p {
            margin: 4rem 0;
            text-align: center;
          }
        `}
      </style>
      <h1>
        <FormattedMessage id="notFound" defaultMessage="Not found" />
      </h1>
      <div className="shrug">¯\_(ツ)_/¯ </div>
      {slug && (
        <p>
          <Button href={`/search?q=${slug}`} className="blue">
            <FormattedMessage id="notFound.search" defaultMessage="search for {term} " values={{ term: slug }} />
          </Button>
        </p>
      )}
    </div>
  );
};

NotFound.propTypes = {
  slug: PropTypes.string,
};

export default NotFound;
