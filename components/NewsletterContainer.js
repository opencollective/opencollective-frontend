import React from 'react';
import { FormattedMessage } from 'react-intl';
import { H5 } from './Text';
import Container from './Container';
import { Flex } from '@rebass/grid';
import StyledInput, { SubmitInput } from '../components/StyledInput';

class NewsletterContainer extends React.Component {
  render() {
    return (
      <Container py={5}>
        <H5 mb={4} px={3} textAlign="center">
          <FormattedMessage
            id="newsletter.container.title"
            defaultMessage="Stay updated about our news and progress."
          />
        </H5>

        <Flex justifyContent="center">
          <form
            action="https://opencollective.us12.list-manage.com/subscribe/post?u=88fc8f0f3b646152f1cfe447a&amp;id=475db6d2d7"
            method="post"
            name="mc-embedded-subscribe-form"
            target="_blank"
          >
            <Container
              border="1px solid"
              borderColor="black.transparent.20"
              borderRadius={50}
              bg="white.full"
              display="flex"
              justifyContent="space-between"
              overflow="hidden"
              width={300}
            >
              <StyledInput
                bare
                fontSize="Paragraph"
                name="EMAIL"
                px={3}
                py={1}
                minWidth={200}
                placeholder="Your email address"
                type="email"
                width={1}
              />
              <SubmitInput
                buttonSize="small"
                fontWeight="500"
                textAlign="center"
                name="subscribe"
                type="submit"
                value="Subscribe"
              />
            </Container>
          </form>
        </Flex>
      </Container>
    );
  }
}

export default NewsletterContainer;
