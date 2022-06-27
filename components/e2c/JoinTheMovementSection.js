import React from 'react';
import { FormattedMessage } from 'react-intl';

import { JoinUsActionContainer, JoinUsWrapper } from '../collectives/sections/JoinUs';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import { Span } from '../Text';

const JoinTheMovement = () => (
  <JoinUsWrapper py={[5, null, null, 4]} width={1}>
    <Flex
      mx={[3, 4]}
      flexDirection={['column', null, null, 'row']}
      color="black.900"
      alignItems={'center'}
      justifyContent="center"
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems={['center', null, 'flex-start']}
        my={[2, 3, null, 5]}
        mr={[null, null, null, 5]}
      >
        <Box width={[null, '408px', '569px', '335px', '406px']}>
          <SectionTitle mb={2} mt={[5, null, null, 0]} textAlign={['center', null, 'left']}>
            <FormattedMessage id="e2c.joinTheMovement" defaultMessage="Join the movement and support us" />
          </SectionTitle>
        </Box>
        <Box my={(null, null, null, null, 3)} width={['288px', '438px', null, '335px', '400px']}>
          <SectionDescription textAlign={['center', null, 'left']}>
            <FormattedMessage
              id="home.joinUsSection.subtitle"
              defaultMessage="Be part of the new generation of communities."
            />
            <Span display={['none', 'inline-block']}>
              <FormattedMessage defaultMessage={'There are a couple of ways for you to contribute:'} />
            </Span>
          </SectionDescription>
        </Box>
      </Box>

      <Container ml={[null, null, null, 3, 6]}>
        <Box mb="16px">
          <JoinUsActionContainer
            link="https://opencollective.com/comms-docs/projects/e2c"
            title={<FormattedMessage id="financialContributions" defaultMessage="Financial contributions" />}
            description={<FormattedMessage defaultMessage="Get a tax-deductible receipt with your donation" />}
          />
        </Box>
        <JoinUsActionContainer
          link="mailto:pia@opencollective.com"
          title={<FormattedMessage id="helpResearch" defaultMessage="Help us with research" />}
          description={
            <FormattedMessage defaultMessage="Email us and find how you can contribute with your time to add to the research about sharing ownership within organizations." />
          }
        />
      </Container>
    </Flex>
  </JoinUsWrapper>
);

export default JoinTheMovement;
