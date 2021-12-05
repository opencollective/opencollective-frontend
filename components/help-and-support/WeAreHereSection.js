import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledCard from '../StyledCard';
import StyledLink from '../StyledLink';
import { H2, H3, P } from '../Text';

const WeAreHereIfYouWantToTalk = () => (
  <Flex flexDirection="column" px={3} alignItems="center" my="58px">
    <Box textAlign="center" mb="40px" width={['256px', '660px', '768px']}>
      <H2
        fontSize={['32px', '40px']}
        lineHeight={['40px', '48px']}
        letterSpacing={['-0.008em', '-0.04em']}
        mb={3}
        color="black.900"
      >
        <FormattedMessage
          id="helpAndSupport.weAreHere"
          defaultMessage="We’re here if you
want to talk!"
        />
      </H2>
    </Box>
    <Flex flexDirection={['column', 'row']} alignItems="center">
      <StyledCard
        as={StyledLink}
        href="https://slack.opencollective.com/"
        borderWidth="0px"
        boxShadow={['0px 1px 4px 1px rgba(49, 50, 51, 0.1)', 'unset']}
        padding={['16px', 0]}
        openInNewTab
        mb={['40px', 0]}
        textAlign="center"
        width={['288px', '296px']}
      >
        <H3 fontSize="24px" lineHeight="32px" color="black.800" letterSpacing="-0.008em" mb="6px">
          <FormattedMessage
            id="helpAndSupport.joinCommunity"
            defaultMessage="Join our
slack community"
          />
        </H3>
        <P fontSize="16px" lineHeight="24px" color="black.700">
          https://slack.opencollective.com/
        </P>
      </StyledCard>
      <Box width="2px" height="64px" backgroundColor="#1869F5" mx="40px" display={['none', 'inline-block']} />
      <StyledCard
        as={Link}
        href="https://slack.opencollective.com/"
        borderWidth="0px"
        boxShadow={['0px 1px 4px 1px rgba(49, 50, 51, 0.1)', 'unset']}
        padding={['16px', 0]}
        openInNewTab
        textAlign="center"
        width={['288px', '296px']}
      >
        <H3 fontSize="24px" lineHeight="32px" color="black.800" letterSpacing="-0.008em">
          <FormattedMessage id="helpAndSupport.bugs" defaultMessage="Bugs & feature requests" />
        </H3>
        <P fontSize="16px" lineHeight="24px" color="black.700">
          https://github.com/opencollective
        </P>
      </StyledCard>
    </Flex>
  </Flex>
);

export default WeAreHereIfYouWantToTalk;
