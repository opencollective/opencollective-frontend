import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import Newsletter from '../home/Newsletter';
import StyledLink from '../StyledLink';
import { H2, P } from '../Text';

const OCIsATechPlatform = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" px="16px" my={['56px', '80px', '104px']}>
      <Box width={['288px', '698px']} mb="40px">
        <H2
          letterSpacing="-0.008em"
          fontSize={['28px', '32px']}
          lineHeight={['36px', '40px']}
          textAlign="center"
          color="black.900"
        >
          <FormattedMessage
            id="e2c.OCIsATechPlatform"
            defaultMessage="Today, Open Collective is a tech platform that
enables a network of:"
          />
        </H2>
      </Box>
      <Box width="288px" height="232px" mb="40px" display={[null, 'none']}>
        <NextIllustration
          alt="Challenging business as usual"
          src="/static/images/e2c/placeholder.png"
          width={416}
          height={354}
        />
      </Box>
      <Box width={['288px', '700px', '956px', null, '1088px']} mb="40px" display={['none', 'block']}>
        <NextIllustration
          alt="Challenging business as usual"
          src="/static/images/e2c/placeholder-landscape.png"
          width={1088}
          height={232}
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
        <StyledLink buttonStyle="standard" buttonSize="medium" href="/discover" fontWeight="500">
          <FormattedMessage id="e2c.browseCollectives" defaultMessage="Browse Collectives" />
        </StyledLink>
      </Box>
      <Box my={['56px', '80px', '104px']}>
        <NextIllustration
          alt="Open collective logo illustration"
          src="/static/images/e2c/oc-logo-illustration.png"
          width={88}
          height={87}
        />
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
      <Box my={['56px', '104px']} width={['248px', '405px', '482px']} height={['117px', '138px', '227px']}>
        <NextIllustration
          alt="E2C logo illustration"
          src="/static/images/e2c/e2c-logo-illustration.png"
          width={482}
          height={227}
        />
      </Box>
      <LearnWithUs />
    </Flex>
  );
};

const LearnWithUs = () => (
  <Flex flexDirection={['column', 'row']} alignItems="center" justifyContent="center">
    <Box width={['288px', '330px', '458px', null, '524px']} mb={['40px', 0]} mr={[null, '40px']}>
      <NextIllustration
        alt="Challenging business as usual"
        src="/static/images/e2c/placeholder.png"
        width={416}
        height={354}
      />
    </Box>
    <Box width={['288px', '330px', '458px', null, '524px']}>
      <H2 letterSpacing="-0.008em" fontSize="32px" lineHeight="40px" color="black.900" mb="24px">
        <FormattedMessage id="e2c.learnWithUs" defaultMessage="Learn with us" />
      </H2>
      <P fontSize="18px" lineHeight="26px" color="black.800" fontWeight="500" mb="24px">
        <FormattedMessage
          id="e2c.learnWithUs.description"
          defaultMessage="Sign up to be notified of live conversations with our CEO Pia Mancini, Open Collective hosts, and admins from our 7000 collectives about ways to transition from a privately owned company to a structure that allows us to share power and revenue with you."
        />
      </P>
      <Newsletter />
    </Box>
  </Flex>
);

export default OCIsATechPlatform;
