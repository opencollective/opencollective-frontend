import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { flicker } from '../../StyledKeyframes';
import { H4 } from '../../Text';

const BackgroundImage = styled.img.attrs({ src: '/static/images/home/create-collective-bg-illustration.png' })`
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
`;

const BackgroundImageHover = styled.img.attrs({
  src: '/static/images/home/create-collective-bg-illustration-hover.png',
})`
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.2s;
`;

const Wrapper = styled(Box)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &:hover {
    ${BackgroundImageHover} {
      opacity: 1;
      animation: ${flicker({ minOpacity: 0.7 })} 1s infinite;
      animation-delay: 0.2s;
    }
  }
`;

const CreateCollectiveButton = styled(StyledButton)`
  pointer-events: auto;
`;

const CreateCollective = () => {
  return (
    <Flex
      mx={[3, 4]}
      mt={[5, null, 2, null, 5]}
      mb={[4, null, null, null, 5]}
      display="none"
      flexDirection={['column', 'row']}
      justifyContent="center"
      alignItems="center"
    >
      <Box width={['288px', '325px']} my={2} textAlign={['center', 'left']} mr={[null, 2]}>
        <H4 fontSize="24px" lineHeight="32px" letterSpacing="-0.8px" fontWeight="bold">
          <FormattedMessage
            id="home.whatCanYouDoSection.areYouReady"
            defaultMessage="Are you ready to make your community sustainable?"
          />
        </H4>
      </Box>
      <Wrapper width={['288px', '283px']} height={['288px', '294px']}>
        <BackgroundImage alt="Background" />
        <BackgroundImageHover alt="Background Image Hover" />
        <Link href="/create">
          <CreateCollectiveButton buttonStyle="dark" minWidth={'164px'}>
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </CreateCollectiveButton>
        </Link>
      </Wrapper>
    </Flex>
  );
};

export default CreateCollective;
