import React from 'react';
import Container from './Container';
import { Flex, Box } from '@rebass/grid';
import { Envelope } from '@styled-icons/fa-solid/Envelope';

import StyledInput from '../components/StyledInput';
import StyledButton from './StyledButton';

class NewsletterContainer extends React.Component {
  render() {
    return (
      <Container>
        <Flex>
          <Box
            as="form"
            action="https://opencollective.us12.list-manage.com/subscribe/post?u=88fc8f0f3b646152f1cfe447a&amp;id=475db6d2d7"
            method="post"
            name="mc-embedded-subscribe-form"
            target="_blank"
          >
            <Container
              border="1px solid"
              borderColor="black.transparent.20"
              borderRadius={10}
              bg="white.full"
              display="flex"
              justifyContent="space-between"
              overflow="hidden"
              width={288}
            >
              <StyledInput
                bare
                fontSize="Paragraph"
                name="EMAIL"
                px={3}
                py={2}
                minWidth={200}
                placeholder="Enter your email address"
                type="email"
                width={1}
              />
              <StyledButton name="subscribe" type="submit" color="blue.600" border="none" outline="none">
                <Envelope size="16" />
              </StyledButton>
            </Container>
          </Box>
        </Flex>
      </Container>
    );
  }
}

export default NewsletterContainer;
