import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import ListItem from '../ListItem';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import { H3, H5, P } from '../Text';

const ListContainer = styled.ul`
  padding-left: 20px;
`;

const StyledListItem = styled(ListItem)`
  &::before {
    content: '• ';
    color: ${themeGet('colors.primary.600')};
    font-weight: bold;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
  }

  a {
    text-decoration-color: ${themeGet('colors.black.500')};
  }

  a:hover {
    color: ${themeGet('colors.black.800')};
    text-decoration: underline;
    text-decoration-color: ${themeGet('colors.primary.600')};
  }
`;

const GetToKnowUs = () => {
  return (
    <Flex flexDirection="column" px="16px" justifyContent="center" alignItems="center">
      <Flex flexDirection="column" alignItems="center">
        <Box maxWidth={['288px', '700px', '880px']}>
          <SectionTitle textAlign="center" mb={3}>
            <FormattedMessage id="home.getToKnowUs" defaultMessage="Get to know us." />
          </SectionTitle>
        </Box>
        <Box maxWidth={['288px', '700px', '768px']}>
          <SectionDescription textAlign="center" color="black.800">
            <FormattedMessage
              id="home.getToKnowUs.description"
              defaultMessage="Browse stories, blog posts, resources, and get support from the community."
            />
          </SectionDescription>
        </Box>
      </Flex>
      <Flex flexDirection={['column', 'row']} my="32px">
        <Container
          maxWidth={['288px', '342px', '470px', null, '536px']}
          py="48px"
          px="32px"
          border="2px solid"
          borderColor="primary.900"
          borderRadius="16px"
          mb={[3, 0]}
        >
          <H3 fontSize={['32px']} lineHeight={['40px']} letterSpacing={['-0.008em']} color="primary.900">
            <FormattedMessage id="home.exploreAndLearn" defaultMessage="Explore and learn" />
          </H3>
          <P my="24px" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" color="black.800">
            <FormattedMessage
              defaultMessage="Read more about how we operate and what projects we have for the present and future."
              id="3XixSl"
            />
          </P>
          <ListContainer>
            <StyledListItem fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" mb="24px">
              <StyledLink
                color="black.800"
                href="https://blog.opencollective.com"
                openInNewTab
                textDecoration="underline"
              >
                <FormattedMessage defaultMessage="Read our blog" id="AgyCr7" />
              </StyledLink>
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <StyledLink color="black.800" href="/e2c" textDecoration="underline">
                <FormattedMessage defaultMessage="Our exit strategy" id="WvqSvr" />
              </StyledLink>
            </StyledListItem>
            <StyledListItem fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" mb="24px">
              <StyledLink color="black.800" href="/become-a-sponsor" textDecoration="underline">
                <FormattedMessage defaultMessage="Info for financial sponsors" id="oqqit/" />
              </StyledLink>
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
            >
              <StyledLink
                color="black.800"
                href="https://blog.opencollective.com/tag/case-studies/"
                textDecoration="underline"
                openInNewTab
              >
                <FormattedMessage defaultMessage="Case studies" id="POZqkv" />
              </StyledLink>
            </StyledListItem>
          </ListContainer>
        </Container>
        <Container
          maxWidth={['288px', '342px', '470px', null, '536px']}
          py="48px"
          px="32px"
          border="2px solid"
          borderColor="primary.900"
          borderRadius="16px"
          ml={[null, 3]}
        >
          <H3 fontSize={['32px']} lineHeight={['40px']} letterSpacing={['-0.008em']} color="primary.900">
            <FormattedMessage id="home.helpAndSupport" defaultMessage="Help and support" />
          </H3>
          <P my="24px" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em" fontWeight="500" color="black.800">
            <FormattedMessage
              defaultMessage="Learn more about how it all works: our philosophy and business model."
              id="cI3CsE"
            />
          </P>
          <ListContainer>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <StyledLink color="black.800" href="/help" textDecoration="underline">
                <FormattedMessage defaultMessage="Visit the support page" id="t/HtIc" />
              </StyledLink>
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <StyledLink
                color="black.800"
                href="https://docs.opencollective.com"
                textDecoration="underline"
                openInNewTab
              >
                <FormattedMessage defaultMessage="Read through our documentation" id="wdcTBA" />
              </StyledLink>
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
              mb="24px"
            >
              <StyledLink
                color="black.800"
                href="https://slack.opencollective.com/"
                textDecoration="underline"
                openInNewTab
              >
                <FormattedMessage defaultMessage="Slack and email" id="ZelEql" />
              </StyledLink>
            </StyledListItem>
            <StyledListItem
              fontSize="20px"
              lineHeight="28px"
              letterSpacing="-0.008em"
              fontWeight="500"
              color="black.800"
            >
              <StyledLink color="black.800" href="/pricing" textDecoration="underline" openInNewTab>
                <FormattedMessage defaultMessage="Pricing and Business Model" id="70Nuf5" />
              </StyledLink>
            </StyledListItem>
          </ListContainer>
        </Container>
      </Flex>
      <Flex flexDirection={['column', 'row']} justifyContent="center" alignItems="center">
        <Box mb="16px" display={[null, 'none']}>
          <NextIllustration
            width={288}
            height={238}
            alt="Exit to community illustration"
            src="/static/images/new-home/e2c-illustration.png"
          />
        </Box>
        <Box mb="16px" display={['none', 'block', 'none']}>
          <NextIllustration
            width={392}
            height={324}
            alt="Exit to community illustration"
            src="/static/images/new-home/e2c-illustration-sm.png"
          />
        </Box>
        <Box mb="16px" display={['none', null, 'block']}>
          <NextIllustration
            width={558}
            height={454}
            alt="Exit to community illustration"
            src="/static/images/new-home/e2c-illustration-lg.png"
          />
        </Box>
        <Box textAlign={['center', 'left']} ml={[null, '24px']} width={['288px', '318px', '472px']}>
          <H5
            mb="16px"
            fontSize={['20px', '32px', '40px']}
            lineHeight={['28px', '40px', '48px']}
            fontWeight="700"
            letterSpacing={['-0.008em', null, '-0.04em']}
            color="primary.900"
          >
            <FormattedMessage defaultMessage="Where we're heading..." id="r96v2J" />
          </H5>
          <P
            fontSize={['15px', '16px', '20px']}
            lineHeight={['22px', '24px', '28px']}
            color="black.800"
            letterSpacing={[null, null, '-0.008em']}
            fontWeight="500"
          >
            <FormattedMessage
              id="e2c.description"
              defaultMessage="Join us as we transition from a privately owned company to a structure that allows us to share power and revenue with you."
            />
          </P>
          <Box display={['none', null, 'block']} mt="24px">
            <Link href="/e2c">
              <StyledButton
                minWidth="135px"
                my={['12px', null, 0]}
                buttonStyle="marketing"
                whiteSpace="nowrap"
                backgroundColor="primary.900"
                fontSize="16px"
                lineHeight="20px"
              >
                <FormattedMessage defaultMessage="Learn more" id="TdTXXf" />
              </StyledButton>
            </Link>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
};

export default GetToKnowUs;
