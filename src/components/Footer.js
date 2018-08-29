import React from 'react';
import styled from 'styled-components';
import { Box, Flex } from 'grid-styled';
import { P } from './Text';
import Container from './Container';
import {
  GithubIcon,
  MailIcon,
  MediumIcon,
  SlackIcon,
  TwitterIcon,
} from './icons';
import ListItem from './ListItem';
import StyledLink from './StyledLink';

const SocialLink = styled.a`
  align-items: center;
  border: 1px solid #9399A3;
  border-radius: 50%;
  display: flex;
  height: 48px;
  justify-content: center;
  opacity: 0.6;
  width: 48px;

  &:hover, &:focus {
    opacity: 1;
  }
`;

const FlexList = styled.ul([],
  ...Box.componentStyle.rules,
  ...Flex.componentStyle.rules,
);

const navigation = {
  PLATFORM: {
    Discover: '/discover',
    'How it Works': '/learn-more',
    'Use Cases': '/opensource',
    'Sign Up': '/signin',
    Login: '/signin',
  },
  'JOIN THE MOVEMENT': {
    'Create a Collective': '/create',
    'Become a Sponsor': '/organizations/new',
    'Create a chapter': '/chapters',
  },
  COMMUNITY: {
    'Open Source': '/opensource',
    'Report an issue': 'https://github.com/opencollective/opencollective/issues',
    Slack: 'https://slack.opencollective.com',
    Wiki: 'https://github.com/opencollective/opencollective/wiki',
    'Email Support': 'mailto:support@opencollective.com'
  },
  COMPANY: {
    About: '/about',
    'FAQ': '/faq',
    Blog: 'https://medium.com/open-collective',
    'Terms of Service': '/tos',
    'Privacy Policy': '/privacypolicy',
  },
};

class Footer extends React.Component {
  render() {
    return (
      <Container 
        id="footer"
        bg="white"
        borderTop="1px solid #aaaaaa"
        bottom={0}
        minHeight="7.5rem"
        p="1rem"
        width={1}
      >
        <Flex p={2} justifyContent="space-between" alignItems={['center', null, 'flex-start']} mx="auto" flexDirection={['column', null, 'row']} css="max-width: 1300px;">
          <Container
            display="flex"
            mt={3}
            w={[null, null, 1/3]}
            flexDirection="column"
            maxWidth="300px"
          >
            <Flex justifyContent={['center', null, 'flex-start']}>
              <object type="image/svg+xml" data="/static/images/opencollectivelogo-footer.svg" height="20"></object>
            </Flex>
            <P textAlign={['center', null, 'left']} color="#6E747A" fontSize="1.4rem" py={2}>An organization for your community, transparent by design.</P>
          </Container>
          <Container
            display="flex"
            justifyContent="space-evenly"
            alignItems="center"
            w={1} my={3}
            order={[null, null, '3']}
            maxWidth="300px"
          >
            <SocialLink href="https://medium.com/open-collective">
              <MediumIcon size={15} fill="#9399A3" />
            </SocialLink>
            <SocialLink href="https://twitter.com/opencollect">
              <TwitterIcon size={15} fill="#9399A3" />
            </SocialLink>
            <SocialLink href="https://github.com/opencollective">
              <GithubIcon size={15} fill="#9399A3" />
            </SocialLink>
            <SocialLink href="https://slack.opencollective.com">
              <SlackIcon size={15} fill="#9399A3" />
            </SocialLink>
            <SocialLink href="mailto:info@opencollective.com">
              <MailIcon size={15} fill="#9399A3" />
            </SocialLink>
          </Container>
          <Flex is="nav" flexWrap="wrap" justifyContent="center" mt={3} flex="1 1 auto">
            {Object.keys(navigation).map((key) => (
              <Box key={key} w={[0.5, null, 0.25]} mb={3}>
                <P textAlign={['center', null, 'left' ]} fontSize="1.2rem" color="#C2C6CC" letterSpacing="1px" pb={3}>{key}</P>
                <FlexList justifyContent="center" flexDirection="column" pl={0} pr={2}>
                  {Object.keys(navigation[key]).map((item) => (
                    <ListItem key={item} textAlign={['center', null, 'left']} mb={2}>
                      <StyledLink
                        href={navigation[key][item]}
                        color="#6E747A"
                        display="block"
                        fontSize="1.4rem"
                        fontWeight="400"
                        m={0}
                        p={0}
                      >
                        {item}
                      </StyledLink>
                    </ListItem>
                  ))}
                </FlexList>
              </Box>
            ))}
          </Flex>
        </Flex>
      </Container>
    );
  }
}

export default Footer;

