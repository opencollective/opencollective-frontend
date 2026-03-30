import React from 'react';
import Router from 'next/router';
import { FormattedMessage } from 'react-intl';

import Container from '../components/Container';
import { Flex } from '../components/Grid';
import Image from '../components/Image';
import Page from '../components/Page';
import StyledButton from '../components/StyledButton';
import { H1, P } from '../components/Text';

export default function AccessDeniedPage() {
  return (
    <Page
      data-cy="error-page"
      title="Access denied"
      description="You do not have access to this resource."
      noRobots
      showSearch={false}
    >
      <Container py={[5, 6]}>
        <Flex data-cy="access-denied" flexDirection="column" alignItems="center" p={2}>
          <Image src="/static/images/not-found-illustration.png" alt="Access denied" width={302} height={302} />
          <H1 textAlign="center" mt={3} fontSize="40px" fontWeight="700">
            <FormattedMessage defaultMessage="Access denied" id="T26lW2" />
          </H1>
          <P my="24px" fontSize="20px" fontWeight="500" color="black.800" textAlign="center">
            <FormattedMessage
              defaultMessage="You are not allowed to access this resource." id="mqblI9"
            />
          </P>

          <Flex flexWrap="wrap" justifyContent="center" mt={2}>
            <StyledButton m={2} buttonStyle="secondary" onClick={() => Router.back()}>
              <FormattedMessage defaultMessage="Go back" id="8N5NtR" />
            </StyledButton>
          </Flex>
        </Flex>
      </Container>
    </Page>
  );
}
