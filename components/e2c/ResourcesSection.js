import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Newsletter from '../collectives/Newsletter';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import HorizontalScroller from '../HorizontalScroller';
import { SectionTitle } from '../marketing/Text';
import StyledLink from '../StyledLink';
import { H2, P, Span } from '../Text';

const blogEntries = [
  {
    imageSrc: '/static/images/e2c/blog-1.png',
    title: `Early musings on "Exit to Community" for Doohi Collective`,
    link: 'https://blog.opencollective.com/exit-to-community/',
    date: 'Oct 18 2021',
  },
  {
    imageSrc: '/static/images/e2c/blog-2.png',
    title: `Pathways for Doohi Collective’s “Exit to Community”`,
    link: 'https://blog.opencollective.com/exit-to-community-part-2/',
    date: 'Oct 24 2021',
  },
  {
    imageSrc: '/static/images/e2c/blog-3.png',
    title: `Building Capacity for Exit to Community`,
    link: 'https://blog.opencollective.com/e2c-capacity-building/',
    date: 'Mar 7 2022',
  },
  {
    imageSrc: '/static/images/e2c/blog-4.png',
    title: `Deep dive: community stewardship of Doohi Collective through a Perpetual Purpose Trust`,
    link: 'https://blog.opencollective.com/ppt/',
    date: 'Mar 10 2022',
  },
];

const ResourceContainer = styled(Container)`
  overflow-x: auto;
  padding: 0 16px;
  max-width: 100%;
  width: 300px;

  @media screen and (min-width: 40em) {
    width: 768px;
    justify-content: flex-start;
  }

  @media screen and (min-width: 52em) {
    width: 956px;
  }

  @media screen and (min-width: 64em) {
    width: 1200px;
  }
`;

const ResourcesSection = () => {
  return (
    <React.Fragment>
      <Flex
        flexDirection={['column']}
        justifyContent="center"
        alignItems="center"
        mt={['25px', null, '42px']}
        mb={['51px', '96px']}
      >
        <Box mb="72px">
          <SectionTitle textAlign="center">
            <FormattedMessage id="e2c.resources" defaultMessage="Resources" />
          </SectionTitle>
        </Box>
        <HorizontalScroller
          container={ResourceContainer}
          controlsTopPosition={30}
          containerProps={{ hideScrollbar: true }}
        >
          {blogEntries.map(blogEntry => (
            <Container
              display="flex"
              flexDirection="column"
              minWidth={['288px', '276px', '380px', null, '360px']}
              key={blogEntry.link}
              mx={['8px', '20px']}
            >
              <Box width={['224px', '100%']} mb="32px">
                <NextIllustration
                  alt={`${blogEntry.title} picture`}
                  src={blogEntry.imageSrc}
                  width={349}
                  height={356}
                />
              </Box>
              <Box mb="24px">
                <P
                  fontSize="16px"
                  lineHeight="24px"
                  letterSpacing="0.06em"
                  fontWeight="500"
                  color="black.900"
                  textTransform="uppercase"
                >
                  <Span>
                    <FormattedMessage defaultMessage="Blog Entry" />
                  </Span>{' '}
                  • <Span>{blogEntry.date}</Span>
                </P>
              </Box>
              <StyledLink href={blogEntry.link} openInNewTab textDecoration="underline" textDecorationColor="#141415">
                <Box width={1}>
                  <P
                    textDecoration="underline"
                    fontSize="24px"
                    lineHeight="32px"
                    letterSpacing="-0.008em"
                    color="black.900"
                    fontWeight="500"
                  >
                    {blogEntry.title}
                  </P>
                </Box>
              </StyledLink>
            </Container>
          ))}
        </HorizontalScroller>
      </Flex>
      <LearnWithUs />
    </React.Fragment>
  );
};

const LearnWithUs = () => (
  <Flex flexDirection="column" justifyContent="center" alignItems="center" px="16px" mb="58px">
    <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center">
      <Box width={['288px', '330px', '458px', null, '524px']} mb={['40px', 0]} mr={[null, '40px']}>
        <NextIllustration
          alt="Challenging business as usual"
          src="/static/images/e2c/learnMore-illustration.png"
          width={416}
          height={354}
        />
      </Box>
      <Box width={['288px', '330px', '458px', null, '524px']}>
        <H2 letterSpacing="-0.008em" fontSize="32px" lineHeight="40px" color="primary.900" mb="24px">
          <FormattedMessage id="e2c.learnWithUs" defaultMessage="Learn with us" />
        </H2>
        <P fontSize="18px" lineHeight="26px" color="black.800" fontWeight="500" mb="24px">
          <FormattedMessage
            id="e2c.learnWithUs.description"
            defaultMessage="Sign up to be notified of live conversations with our CEO Pia Mancini, Doohi Collective hosts, and admins from our 7000 collectives about ways to transition from a privately owned company to a structure that allows us to share power and revenue with you."
          />
        </P>
        <Newsletter />
      </Box>
    </Flex>
  </Flex>
);

export default ResourcesSection;
