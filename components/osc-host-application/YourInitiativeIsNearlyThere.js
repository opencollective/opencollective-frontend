import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledLink from '../StyledLink';
import { H1, H3, P } from '../Text';

const Link = styled(StyledLink)`
  margin-left: 8px;
  margin-right: 8px;
  color: #313233;
  text-decoration: underline !important;
  font-weight: 400;
`;

const YourInitiativeIsNearlyThere = () => (
  <Flex flexDirection="column" alignItems="center" justifyContent="center" mt={['24px', '48px']}>
    <Flex flexDirection={'column'} alignItems="center" justifyContent="center" mb={[null, 3]}>
      <Container
        display="flex"
        alignItems="center"
        justifyContent="center"
        width={['288px', '360px']}
        height={('128px', '160px')}
        mb="24px"
      >
        <NextIllustration
          alt="Open Source Collective logotype"
          src="/static/images/osc-logo.png"
          width={240}
          height={240}
        />
      </Container>
      <Box textAlign="center" width={['288px', '404px']} mb="14px" ml={[null, '24px']}>
        <H1 fontSize="32px" lineHeight="40px" letterSpacing="-0.008em" color="black.900" textAlign="center" mb="14px">
          <FormattedMessage
            id="OCFHostApplication.yourInitiativeIsNearlyThere"
            defaultMessage="Your Collective is nearly there!"
          />
        </H1>
        <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.800">
          <FormattedMessage
            id="HostApplication.yourInitiativeIsNearlyThere.description"
            defaultMessage="We will review it and let you know by mail if we need you for anything during the process. {lineBreak}{lineBreak} In the meantime, you can use these useful links."
            values={{
              lineBreak: <br />,
            }}
          />
        </P>
      </Box>
      <Container display="flex" justifyContent="center" alignItems="baseline">
        <Link href="/">
          <FormattedMessage id="home" defaultMessage="Home" />
        </Link>
        <Link href="/help">
          <FormattedMessage id="community.support" defaultMessage="Support" />
        </Link>
        <Link href="https://slack.opencollective.com/">Slack</Link>
        <Link href="https://blog.opencollective.com/">
          <FormattedMessage id="company.blog" defaultMessage="Blog" />
        </Link>
      </Container>
    </Flex>
    <Flex my="48px" flexDirection="column" alignItems="center" justifyContent="center">
      <P fontSize="16px" lineHeight="24px" fontWeight="500" color="black.800">
        <FormattedMessage id="OCFHostApplication.partnerProjects" defaultMessage="These projects are trusting us:" />
      </P>
      <Container
        display="flex"
        alignItems="center"
        justifyContent={['flex-start', 'center']}
        mt={4}
        width={['288px', '672px']}
        overflow="auto"
      >
        <Container
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="208px"
          height="204px"
          borderRadius="12px"
          border="1px solid #E8E9EB"
          padding="16px"
          flexDirection="column"
          mr="24px"
        >
          <Box width="80px" height="80px">
            <NextIllustration
              alt="Chrome logo"
              src="/static/images/ocf-host-application/chrome-logo.png"
              width={80}
              height={80}
            />
          </Box>
          <Box width="176px" textAlign="center">
            <H3 fontSize="20px" color="black.900" lineHeight="28px" my={2}>
              Chrome&apos;s Web Fund
            </H3>
            <P fontSize="14px" color="black.800" lineHeight="20px" fontWeight="500">
              <FormattedMessage id="OCFHostApplication.weAreAFund" defaultMessage="We are a fund" />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="208px"
          height="204px"
          borderRadius="12px"
          border="1px solid #E8E9EB"
          padding="16px"
          flexDirection="column"
        >
          <Box width="80px" height="80px">
            <NextIllustration
              alt="CVKey logo"
              src="/static/images/ocf-host-application/cvKey-logo.png"
              width={80}
              height={80}
            />
          </Box>
          <Box width="176px" textAlign="center">
            <H3 fontSize="20px" color="black.900" lineHeight="28px" my={2}>
              CVKey Project Fund
            </H3>
            <P fontSize="14px" color="black.800" lineHeight="20px" fontWeight="500">
              <FormattedMessage id="OCFHostApplication.weAreAFund" defaultMessage="We are a fund" />
            </P>
          </Box>
        </Container>
        <Container
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="208px"
          height="204px"
          borderRadius="12px"
          border="1px solid #E8E9EB"
          padding="16px"
          flexDirection="column"
          ml="24px"
        >
          <Box width="80px" height="80px">
            <NextIllustration
              alt="WTV logo"
              src="/static/images/ocf-host-application/wtv-logo.svg"
              width={80}
              height={80}
            />
          </Box>
          <Box width="176px" textAlign="center">
            <H3 fontSize="20px" color="black.900" lineHeight="28px" my={2}>
              #Walkthevote Project
            </H3>
            <P fontSize="16px" color="black.800" lineHeight="20px" fontWeight="500">
              <FormattedMessage id="OCFHostApplication.weAreAFund" defaultMessage="We are a fund" />
            </P>
          </Box>
        </Container>
      </Container>
      <StyledLink
        my="40px"
        href="https://docs.oscollective.org/"
        // width={['286px', '215px']}
        buttonStyle="purple"
        buttonSize="medium"
        openInNewTab
      >
        <FormattedMessage
          id="OCFHostApplication.visitDocumentation"
          defaultMessage="Visit the documentation {arrowRight}"
          values={{
            arrowRight: <ArrowRight2 size="14px" />,
          }}
        />
      </StyledLink>
    </Flex>
  </Flex>
);

export default YourInitiativeIsNearlyThere;
