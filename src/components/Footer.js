import React from 'react';
import styled from 'styled-components';
import { Box, Flex } from '@rebass/grid';
import { Github } from 'styled-icons/fa-brands/Github.cjs';
import { MediumM } from 'styled-icons/fa-brands/MediumM.cjs';
import { Slack } from 'styled-icons/fa-brands/Slack.cjs';
import { Twitter } from 'styled-icons/fa-brands/Twitter.cjs';
import { Mail } from 'styled-icons/material/Mail.cjs';

import { Link } from '../server/pages';

import { P } from './Text';
import Container from './Container';
import ListItem from './ListItem';
import StyledLink from './StyledLink';

const SocialLink = styled.a`
  align-items: center;
  border: 1px solid #9399a3;
  border-radius: 50%;
  display: flex;
  height: 48px;
  justify-content: center;
  opacity: 0.6;
  width: 48px;

  &:hover,
  &:focus {
    opacity: 1;
  }
`;

const MenuLink = styled(StyledLink)`
  color: #6e747a;
  display: block;
  fontsize: 1.4rem;
  fontweight: 400;
  margin: 0;
  padding: 0;
`;

const FlexList = styled.ul([], ...Box.componentStyle.rules, ...Flex.componentStyle.rules);

const navigation = {
  PLATFORM: {
    Discover: '/discover',
    'How it Works': '/how-it-works',
    'Sign Up': '/signin',
    Login: '/signin',
  },
  'JOIN THE MOVEMENT': {
    'Create a Collective': '/create',
    'Become a Sponsor': '/become-a-sponsor',
    'Create a chapter': '/chapters',
    'Make a Pledge': '/pledges/new',
  },
  COMMUNITY: {
    'Open Source': '/opensource',
    'Report an issue': 'https://github.com/opencollective/opencollective/issues',
    Slack: 'https://slack.opencollective.com',
    Wiki: 'https://github.com/opencollective/opencollective/wiki',
    'Email Support': 'mailto:support@opencollective.com',
  },
  COMPANY: {
    About: '/about',
    FAQ: '/faq',
    Blog: 'https://medium.com/open-collective',
    'Terms of Service': '/tos',
    'Privacy Policy': '/privacypolicy',
  },
};

class Footer extends React.Component {
  render() {
    return (
      <Container id="footer" bg="white" borderTop="1px solid #aaaaaa" bottom={0} minHeight="7.5rem" p="1rem" width={1}>
        <Flex
          p={2}
          justifyContent="space-between"
          alignItems={['center', null, 'flex-start']}
          mx="auto"
          flexDirection={['column', null, 'row']}
          css="max-width: 1300px;"
        >
          <Container display="flex" mt={3} width={[1, null, 1 / 3]} flexDirection="column" maxWidth="300px">
            <Flex justifyContent={['center', null, 'flex-start']}>
              <object type="image/svg+xml" data="/static/images/opencollectivelogo-footer.svg" height="20" />
            </Flex>
            <P textAlign={['center', null, 'left']} color="#6E747A" fontSize="1.4rem" py={2}>
              An organization for your community, transparent by design.
            </P>
          </Container>
          <Container
            display="flex"
            justifyContent="space-evenly"
            alignItems="center"
            width={1}
            my={3}
            order={['2', null, '3']}
            maxWidth="300px"
          >
            <SocialLink href="https://medium.com/open-collective">
              <MediumM size={17} color="#9399A3" />
            </SocialLink>
            <SocialLink href="https://twitter.com/opencollect">
              <Twitter size={17} color="#9399A3" />
            </SocialLink>
            <SocialLink href="https://github.com/opencollective">
              <Github size={17} color="#9399A3" />
            </SocialLink>
            <SocialLink href="https://slack.opencollective.com">
              <Slack size={17} color="#9399A3" />
            </SocialLink>
            <SocialLink href="mailto:info@opencollective.com">
              <Mail size={19} color="#9399A3" />
            </SocialLink>
          </Container>
          <Flex as="nav" flexWrap="wrap" justifyContent="center" mt={3} flex="1 1 auto" order={['3', null, '2']}>
            {Object.keys(navigation).map(key => (
              <Box key={key} width={[0.5, null, 0.25]} mb={3}>
                <P textAlign={['center', null, 'left']} fontSize="1.2rem" color="#C2C6CC" letterSpacing="1px" pb={3}>
                  {key}
                </P>
                <FlexList justifyContent="center" flexDirection="column" pl={0} pr={2}>
                  {Object.keys(navigation[key]).map(item => (
                    <ListItem key={item} textAlign={['center', null, 'left']} mb={2}>
                      {
                        <Link route={navigation[key][item]} passHref>
                          <MenuLink>{item}</MenuLink>
                        </Link>
                      }
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
