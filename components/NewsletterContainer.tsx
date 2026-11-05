import React from 'react';
import { FormattedMessage } from 'react-intl';

import StyledInput from '../components/StyledInput';

import Container from './Container';
import { Flex } from './Grid';
import { H5 } from './Text';

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
                fontSize="14px"
                name="EMAIL"
                px={3}
                py={1}
                minWidth={200}
                placeholder="Your email address"
                type="email"
                width={1}
              />
              <input
                className="cursor-pointer rounded rounded-l-none bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-700"
                type="submit"
                value="Subscribe"
                name="subscribe"
              />
            </Container>
          </form>
        </Flex>
      </Container>
    );
  }
}

export default NewsletterContainer;
