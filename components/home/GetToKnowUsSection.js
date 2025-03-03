import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import ListItem from '../ListItem';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledLink from '../StyledLink';
import { H3, P } from '../Text';

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
                href="https://discord.opencollective.com/"
                textDecoration="underline"
                openInNewTab
              >
                Discord
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
    </Flex>
  );
};

export default GetToKnowUs;
