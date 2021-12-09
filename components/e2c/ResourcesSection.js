import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import HorizontalScroller from '../HorizontalScroller';
import { H2, P, Span } from '../Text';

const blogEntries = [
  {
    imageSrc: '/static/images/e2c/placeholder.png',
    title: `Early musings on "Exit to Community" for Open Collective`,
    link: '/',
    date: 'Oct 18 2021',
  },
  {
    imageSrc: '/static/images/e2c/placeholder.png',
    title: `Early musings on "Exit to Community" for Open Collective`,
    link: '/',
    date: 'Oct 18 2021',
  },
  {
    imageSrc: '/static/images/e2c/placeholder.png',
    title: `Pathways for Open Collective’s “Exit to Community”`,
    link: '/',
    date: 'Oct 18 2021',
  },
];

const ResourceContainer = styled(Container)`
  display: flex;
  overflow-x: auto;
  padding: 0 16px;
  max-width: 100%;
  width: 300px;

  @media screen and (min-width: 40em) {
    width: 768px;
  }

  @media screen and (min-width: 52em) {
    width: 956px;
  }
`;

const ResourcesSection = () => {
  return (
    <Flex flexDirection={['column']} justifyContent="center" alignItems="center">
      <Box mb="72px">
        <H2
          letterSpacing="-0.008em"
          fontSize={['32px', '40px']}
          lineHeight={['40px', '48px']}
          textAlign="center"
          color="black.900"
        >
          <FormattedMessage id="e2c.resources" defaultMessage="Resources" />
        </H2>
      </Box>
      <HorizontalScroller container={ResourceContainer}>
        {blogEntries.map((blogEntry, index) => (
          <Container
            display="flex"
            flexDirection="column"
            width={['254px', '276px', '378px']}
            key={index.toString()}
            mx="8px"
          >
            <Box width={['224px', '100%']} height={['266px', '296px']} mb="32px">
              <NextIllustration alt={`${blogEntry.title} picture`} src={blogEntry.imageSrc} width={360} height={375} />
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
            <Box width={1}>
              <P fontSize="24px" lineHeight="32px" letterSpacing="-0.008em" color="black.900" fontWeight="500">
                {blogEntry.title}
              </P>
            </Box>
          </Container>
        ))}
      </HorizontalScroller>
    </Flex>
  );
};

export default ResourcesSection;
