import React from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import Router from 'next/router';

import StyledButton from './StyledButton';
import { H1, P } from './Text';
import Link from './Link';

const NotFound = ({ searchTerm }) => {
  return (
    <Flex data-cy="not-found" flexDirection="column" alignItems="center">
      <style jsx>
        {`
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
      <H1>
        <FormattedMessage id="notFound" defaultMessage="Not found" />
      </H1>
      <P fontSize="3.6rem" color="primary.500" mt={4} mb={5}>
        ¯\_(ツ)_/¯
      </P>
      {searchTerm && (
        <Flex flexWrap="wrap" justifyContent="center">
          <StyledButton m={2} onClick={() => Router.back()}>
            &larr; <FormattedMessage id="error.goBack" defaultMessage="Go back to previous page" />
          </StyledButton>
          <Link route="search" params={{ q: searchTerm }}>
            <StyledButton m={2} buttonStyle="primary">
              <FormattedMessage
                id="notFound.search"
                defaultMessage="Search for {term}"
                values={{ term: <strong>{searchTerm}</strong> }}
              />
            </StyledButton>
          </Link>
        </Flex>
      )}
    </Flex>
  );
};

NotFound.propTypes = {
  searchTerm: PropTypes.string,
};

export default NotFound;
