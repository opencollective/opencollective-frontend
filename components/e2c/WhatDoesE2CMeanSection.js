import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { H2, P, Span } from '../Text';

const WhatDoesE2CMean = () => {
  return (
    <Flex justifyContent="center" alignItems="center" px="16px" my={['56px', '80px', '104px']}>
      <Flex
        flexDirection={['column', null, 'row-reverse']}
        justifyContent="center"
        alignItems="center"
        maxWidth={[null, null, null, null, '1088px']}
      >
        <Box width={['288px', 1]}>
          <H2
            letterSpacing="-0.04em"
            fontSize={['32px', '40px']}
            lineHeight={['40px', '48px']}
            textAlign={['center', null, 'left']}
            color="primary.900"
            display={[null, null, 'none']}
          >
            <FormattedMessage id="e2c.whatDoesE2CMean" defaultMessage="What does exit to community mean?" />
          </H2>
        </Box>
        <Box
          my={['31px', null, 0]}
          ml={[null, null, '32px']}
          width={['288px', '516px', '534px']}
          minWidth={[null, null, '534px']}
        >
          <NextIllustration
            alt="How Doohi Collective works"
            src="/static/images/e2c/whatDoesE2CMean-illustration.png"
            width={534}
            height={357}
          />
        </Box>

        <Container display="flex" flexDirection="column" alignItems={['center', null, 'flex-start']}>
          <Box width="346px" display={['none', null, 'block']} mb="32px">
            <H2
              letterSpacing="-0.04em"
              fontSize="40px"
              lineHeight="48px"
              textAlign={['center', null, 'left']}
              color="primary.900"
            >
              <FormattedMessage id="e2c.whatDoesE2CMean" defaultMessage="What does exit to community mean?" />
            </H2>
          </Box>
          <Box width={['288px', '606px', '346px', null, '522px']}>
            <P
              fontSize={['18px', '20px']}
              lineHeight={['26px', '28px']}
              fontWeight="500"
              color="black.800"
              letterSpacing="-0.008em"
            >
              <FormattedMessage
                id="e2c.whatDoesE2CMean.description"
                defaultMessage="Exit to Community (E2C) is an effort to develop alternatives to the standard model of the startup “exit.” Rather than simply aiming for an acquisition by a more established company or a public stock offering, startups can mature into ownership by their community of stakeholders. "
              />
              <Span mt="16px" display="block">
                <strong>- Nathan Schneider</strong>,{' '}
                <Span textDecoration="underline">Director of the Media Enterprise Design Lab</Span>
              </Span>
            </P>
          </Box>
        </Container>
      </Flex>
    </Flex>
  );
};

export default WhatDoesE2CMean;
