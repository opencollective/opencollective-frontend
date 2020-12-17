import React from 'react';
import Router from 'next/router';
import { FormattedMessage } from 'react-intl';

import Body from '../components/Body';
import Container from '../components/Container';
import Footer from '../components/Footer';
import { Flex } from '../components/Grid';
import Header from '../components/Header';
import StyledButton from '../components/StyledButton';
import { H1, P } from '../components/Text';

export default function Custom404() {
  return (
    <div className="ErrorPage" data-cy="error-page">
      <Header />
      <Body>
        <Container borderTop="1px solid #E8E9EB" py={[5, 6]}>
          <Flex data-cy="not-found" flexDirection="column" alignItems="center">
            <H1 textAlign="center">
              <FormattedMessage id="notFound" defaultMessage="Not found" />
            </H1>
            <P fontSize="3.6rem" color="primary.500" mt={4} mb={5}>
              ¯\_(ツ)_/¯
            </P>
            <Flex flexWrap="wrap" justifyContent="center">
              <StyledButton m={2} onClick={() => Router.back()}>
                &larr; <FormattedMessage id="error.goBack" defaultMessage="Go back to previous page" />
              </StyledButton>
            </Flex>
          </Flex>
        </Container>
      </Body>
      <Footer />
    </div>
  );
}
