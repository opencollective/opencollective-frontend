import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import { Box, Flex } from '../components/Grid';
import Image from '../components/Image';
import Link from '../components/Link';
import StyledCard from '../components/StyledCard';
import StyledLink from '../components/StyledLink';

const WelcomeOptionContainer = styled(Container)`
  &:hover {
    background-color: #f5faff;
  }
`;

const Welcome = () => {
  const { LoggedInUser } = useLoggedInUser();
  const intl = useIntl();

  return (
    <AuthenticatedPage
      title={intl.formatMessage({ defaultMessage: 'Welcome to Open Collective!' })}
      showFooter={false}
      showProfileAndChangelogMenu={false}
      showSearch={false}
      menuItemsV2={{ solutions: false, product: false, company: false, docs: false }}
    >
      <Flex
        flexDirection={['column', 'column', 'column', 'row']}
        mb="61px"
        mt="112px"
        justifyContent="center"
        alignItems="center"
      >
        <Flex textAlign="center" flexDirection="column" pr={[0, 0, 0, '48px']}>
          <Box display="flex" justifyContent="center">
            <Image src="/static/images/oc-logo-watercolor-256.png" height={96} width={96} />
          </Box>
          <Container pt="40px" pl="16px" pr={['16px', 0]} width={['100%', '404px']}>
            <Box fontSize="32px" fontWeight="700" color="black.900" lineHeight="40px">
              <FormattedMessage defaultMessage="Welcome to Open Collective!" />
            </Box>
            <Flex fontSize="18px" fontWeight="400" color="black.800" lineHeight="26px" pt="14px">
              <FormattedMessage defaultMessage="Now that you have created your personal account, there are a couple of things you can do from here..." />
            </Flex>
          </Container>
        </Flex>
        <StyledCard
          width={['100%', '520px']}
          display="flex"
          flexDirection="column"
          alignItems="center"
          style={{ overflow: 'visible' }}
          mt={['100px', '100px', '100px', 0]}
        >
          <Box mt="-64px">
            <Image src="/static/images/sample-avatar.png" height={128} width={128} />
          </Box>
          <Flex fontSize="24px" fontWeight="700" color="black.900" lineHeight="32px" pt="40px" pb="40px">
            {LoggedInUser?.collective?.name}
          </Flex>
          <WelcomeOptionContainer mt="16px" width={['100%', '472px']} borderRadius="8px">
            <Link href="/create">
              <Flex alignItems="center" px={['16px', '13px']} py="13px">
                <Box width="100%">
                  <Flex fontSize="18px" fontWeight="700" color="black.900" lineHeight="26px">
                    <FormattedMessage id="collective.create" defaultMessage="Create Collective" />
                  </Flex>
                  <Flex fontSize="15px" fontWeight="500" color="black.700" lineHeight="22px" pt="14px">
                    <FormattedMessage defaultMessage="Create a Collective to be able to accept donations, apply for grants, and manage your budget transparently." />
                  </Flex>
                </Box>
                <Box pl="39px">
                  <Image src="/static/images/right-arrow.png" alt="Right Arrow" width={22} height={20} />
                </Box>
              </Flex>
            </Link>
          </WelcomeOptionContainer>
          <WelcomeOptionContainer mt="16px" width={['100%', '472px']} borderRadius="8px">
            <Link href="/organizations/new">
              <Flex alignItems="center" px={['16px', '13px']} py="13px">
                <Box width="100%">
                  <Flex fontSize="18px" fontWeight="700" color="black.900" lineHeight="26px">
                    <FormattedMessage id="organization.create" defaultMessage="Create Organization" />
                  </Flex>
                  <Flex fontSize="15px" fontWeight="500" color="black.700" lineHeight="22px" pt="14px">
                    <FormattedMessage defaultMessage="Create a profile for your business to appear as financial contributor, enable your employees to contribute on behalf of your company, and more." />
                  </Flex>
                </Box>
                <Box pl="39px">
                  <Image src="/static/images/right-arrow.png" alt="Right Arrow" width={22} height={20} />
                </Box>
              </Flex>
            </Link>
          </WelcomeOptionContainer>
          <WelcomeOptionContainer mt="16px" width={['100%', '472px']} borderRadius="8px">
            <Link href="/search">
              <Flex alignItems="center" px={['16px', '13px']} py="13px">
                <Box width="100%">
                  <Flex fontSize="18px" fontWeight="700" color="black.900" lineHeight="26px">
                    <FormattedMessage defaultMessage="Contribute and engage with more Collectives" />
                  </Flex>
                  <Flex fontSize="15px" fontWeight="500" color="black.700" lineHeight="22px" pt="14px">
                    <FormattedMessage defaultMessage="Discover active Collectives in the platform, contribute and engage with the communities that represent you." />
                  </Flex>
                </Box>
                <Box pl="39px">
                  <Image src="/static/images/right-arrow.png" alt="Right Arrow" width={22} height={20} />
                </Box>
              </Flex>
            </Link>
          </WelcomeOptionContainer>
          <Flex justifyContent="space-between" width={['100%', '472px']} pl="13px" pr="13px" pb="32px" pt="40px">
            {LoggedInUser && (
              <StyledLink href={`/dashboard/${LoggedInUser.collective?.slug}/info`}>
                <FormattedMessage defaultMessage="Go to settings" />
              </StyledLink>
            )}
            <StyledLink href={`/help`}>
              <FormattedMessage defaultMessage="View documentation" />
            </StyledLink>
          </Flex>
        </StyledCard>
      </Flex>
    </AuthenticatedPage>
  );
};

// ignore unused exports default
// next.js export
export default Welcome;
