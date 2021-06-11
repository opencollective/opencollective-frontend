import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import Link from '../Link';
import StyledButton from '../StyledButton';
import { H1, P } from '../Text';

const APlaceToGrowAndThrive = () => {
  return (
    <Flex flexDirection={['column', 'row-reverse']} justifyContent="center" alignItems="center" px="16px" mt={4}>
      <Box ml={[null, '50px', '36px', '40px', '84px']} width={['288px', null, '458px', null, '558px']}>
        <Illustration
          alt="A place to grow and thrive illustration"
          src="/static/images/fiscal-hosting/a-place-to-grow-illustration.png"
        />
      </Box>
      <Container display="flex" flexDirection="column" alignItems={['center', 'flex-start']}>
        <Box mt={[3, 0]} mb={[3, null, null, null, '24px']} width={['288px', '344px', '458px', null, '555px']}>
          <H1
            letterSpacing={['-0.008em', '-0.04em']}
            fontSize={['32px', '40px', null, null, '52px']}
            lineHeight={['40px', '48px', null, null, '56px']}
            textAlign={['center', 'left']}
            color="black.900"
            whiteSpace={[null, null, 'pre-line']}
          >
            <FormattedMessage id="fiscalHosting.title" defaultMessage="A place to grow and thrive" />
          </H1>
        </Box>
        <Box width={['288px', '344px', '458px', null, '558px']} mb={[3, null, null, null, '24px']}>
          <P
            fontSize={['16px', null, null, null, '18px']}
            lineHeight={['24px', null, null, null, '26px']}
            textAlign={['center', 'left']}
            fontWeight="500"
            color="black.800"
          >
            <FormattedMessage
              id="fiscalHosting.description"
              defaultMessage="Think of your community, project, or initiative as a plant, and a fiscal host as a lovingly tended garden. The host maintains an environment where your unique bush, vine, or tree can get watered, grow, and bloom."
            />
          </P>
        </Box>
        <Link href="/create">
          <StyledButton minWidth={[283, 165, null, null, 183]} buttonStyle="dark" whiteSpace="nowrap">
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </StyledButton>
        </Link>
      </Container>
    </Flex>
  );
};

export default APlaceToGrowAndThrive;
