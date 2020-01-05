import React from 'react';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import Illustration from '../HomeIllustration';
import HomePrimaryLink from '../HomePrimaryLink';
import Hide from '../../Hide';
import SectionTitle from '../SectionTitle';
import SectionSubtitle from '../SectionSubtitle';

const FiscalHost = () => (
  <Flex flexDirection={'column'}>
    <Container display={['block', null, 'none']}>
      <Illustration
        width="100%"
        src="/static/images/fiscalhost-mobile-illustration.png"
        alt="Open Collective for Fiscal Sponsors"
      />
    </Container>
    <Container
      ml={[3, 4, null, null, 6]}
      mr={[3, null, null, 0]}
      textAlign={['center', null, 'left']}
      display="flex"
      flexDirection="column"
      alignItems={['center', null, 'flex-start']}
    >
      <SectionTitle>
        <FormattedMessage id="home.fiscalHostSection.title" defaultMessage="Open Collective for Fiscal Sponsors" />
      </SectionTitle>
      <Container display="flex">
        <Box width={[1, null, '838px']}>
          <SectionSubtitle>
            <FormattedMessage
              id="home.fiscalHostSection.subtitle"
              defaultMessage="Some communities don’t want or can’t collect money on a personal bank account. They need to be able to piggyback on an existing legal entity. This is known as “Fiscal Sponsorship”. Open Collective offers Fiscal Sponsors a dashboard to easily manage multiple collectives. No more hairy spreadsheets that are so hard to maintain!"
            />
          </SectionSubtitle>
        </Box>
        <Hide xs sm position="relative" top="-60px">
          <Illustration
            src="/static/images/fiscalhost-desktop-illustration.png"
            alt="Open Collective for Fiscal Sponsors"
          />
        </Hide>
      </Container>
      <Container position={[null, null, 'relative']} top={[null, null, '-170px', null, '-210px']}>
        <Hide md lg>
          <HomePrimaryLink
            href="#"
            display="block"
            width="218px"
            my={3}
            position={[null, null, 'relative']}
            top={[null, null, '-30px']}
          >
            <FormattedMessage id="home.fiscalHost.becomeHostBtn" defaultMessage="Become a fiscal sponsor" />
          </HomePrimaryLink>
        </Hide>
        <Hide xs sm>
          <HomePrimaryLink
            href="#"
            display="block"
            width="304px"
            my={3}
            position={[null, null, 'relative']}
            top={[null, null, '-30px']}
          >
            <FormattedMessage id="home.fiscalSponsor.knowMore" defaultMessage="Know more about Fiscal Sponsors" />
          </HomePrimaryLink>
        </Hide>
      </Container>
    </Container>
  </Flex>
);

export default FiscalHost;
