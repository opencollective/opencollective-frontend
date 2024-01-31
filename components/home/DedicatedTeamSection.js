import React from 'react';
import { FormattedMessage } from 'react-intl';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import { SectionDescription, SectionTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';

const DedicatedTeam = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <Flex flexDirection="column" alignItems="center" px="16px" mb={[0, '73px']}>
        <Box maxWidth={['288px', '700px', '880px']}>
          <SectionTitle textAlign="center" mb={3}>
            <FormattedMessage
              id="home.weDedicatedTeam"
              defaultMessage="We are a dedicated team of people working to spread power and wealth"
            />
          </SectionTitle>
        </Box>
        <Box maxWidth={['288px', '700px', '768px']}>
          <SectionDescription textAlign="center" fontWeight="500">
            <FormattedMessage
              id="home.weDedicatedTeam.description"
              defaultMessage={
                'Doohi Collective is made possible by an international team of people who are committed to community-control of technology. Connect with us.'
              }
            />
          </SectionDescription>
        </Box>
      </Flex>
      <Flex flexDirection="column" alignItems="center" width={1} maxWidth="100%" overflow="hidden">
        <Container
          width={[1, '768px', '1024px', null, '1176px']}
          display={[null, 'flex']}
          my={['24px', '70px']}
          position="relative"
        >
          <Container
            width={[1, '292px', '400px']}
            left={['15%', '50px']}
            position="relative"
            top={['30px', 0]}
            zIndex={['1', 'unset']}
          >
            <NextIllustration width={400} height={269} src="/static/images/new-home/team-picture-2.png" alt="Team" />
          </Container>
          <Container width={[1, '257px', '353px']} top={[null, '-63px']} right={['13%', 0]} position="relative">
            <NextIllustration
              width={353}
              height={237}
              src="/static/images/new-home/team-picture-1.png"
              alt="Team (2)"
            />
          </Container>
          <Container width={[1, '274px', '376px']} position="relative" left={['21%', '-40px']} top={['-42px', 0]}>
            <NextIllustration
              width={376}
              height={252}
              src="/static/images/new-home/team-picture-3.png"
              alt="Team (3)"
            />
          </Container>
        </Container>

        <Box mb={['40px', null, '102px']}>
          <Link href="/contact">
            <StyledButton
              width="142px"
              my={['12px', null, 0]}
              mr={[0, '24px']}
              buttonStyle="marketing"
              whiteSpace="nowrap"
              backgroundColor="primary.900"
              fontSize="16px"
              lineHeight="20px"
            >
              <FormattedMessage defaultMessage="Get in touch" />
            </StyledButton>
          </Link>
        </Box>
      </Flex>
    </Flex>
  );
};

export default DedicatedTeam;
