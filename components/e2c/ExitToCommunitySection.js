import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import { MainDescription, MainTitle } from '../marketing/Text';

const StyledIframe = styled.iframe`
  border: 0.8px solid rgba(50, 51, 52, 0.1);
  border-radius: 16px;
`;

const ExitToCommunity = () => {
  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      px="16px"
      mt={['40px', '56px', null, null, '72px']}
    >
      <Container display="flex" flexDirection="column" alignItems="center">
        <Box mt={[3, 0]} mb="24px" width={['288px', 1]}>
          <MainTitle textAlign="center">
            <FormattedMessage id="e2c.title" defaultMessage="Exit to Community #E2C" />
          </MainTitle>
        </Box>
        <Box width={['288px', '650px']}>
          <MainDescription fontSize="18px" lineHeight="26px" textAlign="center" fontWeight="500" color="black.800">
            <FormattedMessage
              id="e2c.description"
              defaultMessage="Join us as we evolve, focusing on empowering communities to raise funds, sharing success, and distributing resources effectively. "
            />
          </MainDescription>
        </Box>
        <Container
          borderRadius="16px"
          display="flex"
          width={['288px', '700px', '784px']}
          height={['160px', '388px', '426px']}
          background="black"
          mt={['32px', '56px']}
        >
          <StyledIframe
            title="YouTube video"
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/bbtQcW4E_RU"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Container>
      </Container>
    </Flex>
  );
};

export default ExitToCommunity;
