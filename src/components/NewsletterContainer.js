import React from 'react';
import { FormattedMessage } from 'react-intl';
import { H4 } from './Text';
import Container from './Container';
import { Flex } from 'grid-styled';
import StyledInput from '../components/StyledInput';

class NewsletterContainer extends React.Component {

  render() {
    return (
      <Container py={5}>
        <H4 textAlign="center" fontSize={20} mb={4} px={3}><FormattedMessage id="newsletter.container.title" defaultMessage="Stay updated about our news and progress." /></H4>

        <Flex justifyContent="center">
          <form
            action="https://opencollective.us12.list-manage.com/subscribe/post?u=88fc8f0f3b646152f1cfe447a&amp;id=c44469099e"
            method="post"
            name="mc-embedded-subscribe-form"
            target="_blank"
            >
            <Container
              border="1px solid rgba(18,19,20,0.12)"
              borderRadius={50}
              bg="white"
              display="flex"
              justifyContent="space-between"
              overflow="hidden"
              width={300}
              >
              <StyledInput
                fontSize={14}
                name="EMAIL"
                px={3}
                py={1}
                placeholder="Your email address"
                type="email"
                width={1}
                />
              <StyledInput
                bg="#3385FF"
                borderRadius={50}
                color="white"
                fontSize={12}
                fontWeight="bold"
                px={3}
                py={2}
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
