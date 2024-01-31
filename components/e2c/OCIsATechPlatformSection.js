import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { SectionTitle } from '../marketing/Text';
import StyledLink from '../StyledLink';
import { H2 } from '../Text';

const OCIsATechPlatform = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px="16px" my={['56px', '80px', '104px']}>
      <Box width={['288px', '698px', '832px', null, '1088px']} mb="40px">
        <SectionTitle textAlign="center">
          <FormattedMessage
            id="e2c.OCIsATechPlatform"
            defaultMessage="Today, Doohi Collective is a tech platform that
enables a network of:"
          />
        </SectionTitle>
      </Box>
      <Container
        display={['block', 'flex', 'none']}
        justifyContent="center"
        alignItems="center"
        width="100%"
        overflowX="scroll"
        mb="40px"
      >
        <Box display="flex" justifyContent="center" alignItems="center" width="700px" height="408px">
          <NextIllustration
            alt="Challenging business as usual"
            src="/static/images/e2c/network.png"
            width={700}
            height={408}
          />
        </Box>
      </Container>
      <Box width={[null, null, '956px', null, '1088px']} mb="40px" display={['none', null, 'block']}>
        <NextIllustration
          alt="Challenging business as usual"
          src="/static/images/e2c/network-lg.png"
          width={1088}
          height={408}
        />
      </Box>
      <Box width={['288px', '588px', '685px']} mb="24px">
        <H2
          letterSpacing={['-0.008em', '-0.04em']}
          fontSize={['32px', '40px']}
          lineHeight={['40px', '48px']}
          textAlign="center"
          color="black.900"
        >
          <FormattedMessage
            id="e2c.OCstat"
            defaultMessage="600+ nonprofits, co-ops, and fiscal hosts to support 7000+ groups to raise and spend $35 million each year with full transparency"
          />
        </H2>
      </Box>
      <Box width="194px">
        <StyledLink buttonStyle="marketingSecondary" buttonSize="medium" href="/search" fontWeight="500">
          <FormattedMessage id="e2c.browseCollectives" defaultMessage="Browse Collectives" />
        </StyledLink>
      </Box>
      <Box my={['56px', '80px', '104px']}>
        <NextIllustration src="/static/images/e2c/oc-logo-illustration.png" width={88} height={87} />
      </Box>
      <Box width={['288px', '100%', '784px']} mt="55px">
        <H2
          letterSpacing="-0.008em"
          fontSize={['28px', '32px']}
          lineHeight={['32px', '40px']}
          textAlign="center"
          color="black.900"
        >
          <FormattedMessage
            id="e2c.howCanWeRepay"
            defaultMessage="How can we repay our investors, support our founders, and practice financial self-determination? {lineBreak}{lineBreak}How can we future-proof our mission?"
            values={{
              lineBreak: <br />,
            }}
          />
        </H2>
      </Box>
      <Box width={['286px', '432px']} height={['168px', '317px']}>
        <NextIllustration src="/static/images/e2c/e2c-logo-illustration.png" width={431} height={317} />
      </Box>
    </Flex>
  );
};

export default OCIsATechPlatform;
