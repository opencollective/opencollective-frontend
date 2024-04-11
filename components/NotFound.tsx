import React from 'react';
import Router from 'next/router';
import { FormattedMessage } from 'react-intl';

import { ErrorFallbackLinks } from './ErrorFallbackLinks';
import { Box, Flex } from './Grid';
import Image from './Image';
import Link from './Link';
import StyledButton from './StyledButton';
import { H1, P } from './Text';

type NotFoundProps = {
  searchTerm?: string;
  showAltLinks?: boolean;
};

const NotFound = ({ searchTerm, showAltLinks = true }: NotFoundProps) => {
  return (
    <Flex data-cy="not-found" flexDirection="column" alignItems="center" p={2}>
      <Image src="/static/images/not-found-illustration.png" alt="404" width={302} height={302} />
      <H1 textAlign="center" mt={3} fontSize="40px" fontWeight="700">
        <FormattedMessage defaultMessage="Oops! Page not found" id="N7DKaT" />
      </H1>
      <P my="24px" fontSize="20px" fontWeight="500" color="black.800" textAlign="center">
        <FormattedMessage defaultMessage="We can't seem to find the page you are looking for" id="BbiuM/" />
      </P>

      {searchTerm ? (
        <Flex flexWrap="wrap" justifyContent="center" mt={4}>
          <StyledButton m={2} onClick={() => Router.back()}>
            &larr; <FormattedMessage id="error.goBack" defaultMessage="Go back to the previous page" />
          </StyledButton>
          <Link href={{ pathname: '/search', query: { q: searchTerm } }}>
            <StyledButton m={2} buttonStyle="primary">
              <FormattedMessage
                id="notFound.search"
                defaultMessage="Search for {term}"
                values={{ term: <strong>{searchTerm}</strong> }}
              />
            </StyledButton>
          </Link>
        </Flex>
      ) : showAltLinks ? (
        <Box>
          <P fontSize="16px" fontWeight="500" color="black.800" mb="16px">
            <FormattedMessage defaultMessage="Here are some helpful links instead:" id="UTSapC" />
          </P>
          <ErrorFallbackLinks />
        </Box>
      ) : null}
    </Flex>
  );
};

export default NotFound;
