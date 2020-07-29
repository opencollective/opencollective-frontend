import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import { H4 } from '../../Text';

const Wrapper = styled(Box)`
  background-image: ${props =>
    props.hovering
      ? "url('/static/images/home/create-collective-bg-illustration-hover-sm.png')"
      : "url('/static/images/home/create-collective-bg-illustration-sm.png')"};
  background-size: 100% 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (min-width: 52em) {
    background-image: ${props =>
      props.hovering
        ? "url('/static/images/home/create-collective-bg-illustration-hover.png')"
        : "url('/static/images/home/create-collective-bg-illustration.png')"};
    background-size: 100% 100%;
  }
`;

const CreateCollective = () => {
  const [hoverCreateCollectiveButton, setHoverCreateCollectiveButton] = useState(false);

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
        <H4 fontSize={['24px']} lineHeight={['32px']} letterSpacing="-0.8px" fontWeight="bold">
          <FormattedMessage
            id="home.whatCanYouDoSection.areYouReady"
            defaultMessage="Are you ready to make your community sustainable?"
          />
        </H4>
      </Box>
      <Wrapper width={['288px', '283px']} height={['288px', '294']} hovering={hoverCreateCollectiveButton}>
        <Link route="/create">
          <StyledButton
            buttonStyle="dark"
            minWidth={'164px'}
            onMouseEnter={() => setHoverCreateCollectiveButton(true)}
            onMouseLeave={() => setHoverCreateCollectiveButton(false)}
          >
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </StyledButton>
        </Link>
      </Wrapper>
    </Flex>
  );
};

export default CreateCollective;
