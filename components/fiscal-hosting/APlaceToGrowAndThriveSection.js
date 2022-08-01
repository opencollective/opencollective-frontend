import React from 'react';
import { FormattedMessage } from 'react-intl';

import Illustration from '../collectives/HomeIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import { MainDescription, MainTitle } from '../marketing/Text';
import StyledButton from '../StyledButton';

const APlaceToGrowAndThrive = () => {
  return (
    <Flex flexDirection={['column', null, 'row-reverse']} justifyContent="center" alignItems="center" px="16px" mt={4}>
      <Box
        mt={[3, 0]}
        mb={[3, null, null, null, '24px']}
        width={['288px', '601px', '458px', null, '555px']}
        display={[null, null, 'none']}
      >
        <MainTitle textAlign={['center', null, 'left']} whiteSpace={[null, null, 'pre-line']}>
          <FormattedMessage id="fiscalHosting.title" defaultMessage="A place to grow and thrive" />
        </MainTitle>
      </Box>
      <Box ml={[null, '50px', '36px', '40px', '84px']} width={['288px', null, '458px', null, '558px']}>
        <Illustration
          alt="A place to grow and thrive illustration"
          src="/static/images/fiscal-hosting/a-place-to-grow-illustration.png"
        />
      </Box>
      <Container display="flex" flexDirection="column" alignItems={['center', null, 'flex-start']}>
        <Box
          mt={[3, 0]}
          mb={[3, null, null, null, '24px']}
          width={['288px', '344px', '458px', null, '555px']}
          display={['none', null, 'block']}
        >
          <MainTitle textAlign={['center', null, 'left']} whiteSpace={[null, null, 'pre-line']}>
            <FormattedMessage id="fiscalHosting.title" defaultMessage="A place to grow and thrive" />
          </MainTitle>
        </Box>
        <Box width={['288px', '676px', '458px', null, '558px']} mb={[3, null, null, null, '24px']}>
          <MainDescription textAlign={['center', null, 'left']}>
            <FormattedMessage
              id="fiscalHosting.description"
              defaultMessage="Think of your community, project, or initiative as a plant, and a fiscal host as a lovingly tended garden. The host maintains an environment where your unique bush, vine, or tree can get watered, grow, and bloom."
            />
          </MainDescription>
        </Box>
        <Link href="/create">
          <StyledButton minWidth={[283, 165, null, null, 183]} buttonStyle="marketing" whiteSpace="nowrap">
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </StyledButton>
        </Link>
      </Container>
    </Flex>
  );
};

export default APlaceToGrowAndThrive;
