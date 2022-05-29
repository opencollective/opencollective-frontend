import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import NextIllustration from '../home/HomeNextIllustration';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H2, P } from '../Text';

const DedicatedTeam = () => {
  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center">
      <Flex flexDirection="column" alignItems="center" px="16px" mb={[0, '73px']}>
        <Box maxWidth={['288px', '700px', '880px']}>
          <H2
            letterSpacing={['-0.008em', '-0.04em']}
            fontSize={['32px', '40px', '52px']}
            lineHeight={['40px', '48px', '56px']}
            textAlign="center"
            color="primary.900"
            fontWeight="700"
            mb={3}
          >
            <FormattedMessage
              id="home.weDedicatedTeam"
              defaultMessage="We are a dedicated team of people working to spread power and wealth."
            />
          </H2>
        </Box>
        <Box maxWidth={['288px', '700px', '768px']}>
          <P
            fontSize={['18px', '20px']}
            letterSpacing={[null, '-0.008em']}
            lineHeight={['26px', '28px']}
            textAlign="center"
            color="black.800"
            fontWeight="500"
          >
            <FormattedMessage
              id="home.weDedicatedTeam.description"
              defaultMessage={
                'Open Collective is made possible by an international team of people who are committed to community-control of technology. Connect with us.'
              }
            />
          </P>
        </Box>
      </Flex>
      <Flex flexDirection="column" alignItems="center" maxWidth="100%" overflow="hidden">
        <Container
          width={[null, '768px', '1024px', null, '1176px']}
          display={[null, 'flex']}
          my={['24px', '70px']}
          position="relative"
          overflowX={['hidden', 'unset']}
        >
          <Container
            width={[null, '292px', '400px']}
            left={['33px', '50px']}
            position="relative"
            top={['30px', 0]}
            zIndex={['1', 'unset']}
          >
            <NextIllustration width={400} height={269} src="/static/images/new-home/team-picture-2.png" />
          </Container>
          <Container width={[null, '257px', '353px']} top={[null, '-63px']} right={['45px', 0]} position="relative">
            <NextIllustration width={353} height={237} src="/static/images/new-home/team-picture-1.png" />
          </Container>
          <Container width={[null, '274px', '376px']} position="relative" left={['66px', '-40px']} top={['-42px', 0]}>
            <NextIllustration width={376} height={252} src="/static/images/new-home/team-picture-3.png" />
          </Container>
        </Container>

        <Box mb={['40px', null, '102px']}>
          <Link href="/support">
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
