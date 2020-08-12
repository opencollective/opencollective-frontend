import React from 'react';
import PropTypes from 'prop-types';
import { Github } from '@styled-icons/fa-brands/Github';
import { Slack } from '@styled-icons/fa-brands/Slack';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { Blog } from '@styled-icons/icomoon/Blog';
import { Mail } from '@styled-icons/material/Mail';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { Link } from '../server/pages';

import Container from './Container';
import { Box } from './Grid';
import { withUser } from './UserProvider';

const SocialLink = styled.a`
  align-items: center;
  border: 1px solid #9399a3;
  border-radius: 50%;
  display: flex;
  height: 40px;
  justify-content: center;
  opacity: 0.6;
  width: 40px;

  &:hover,
  &:focus {
    opacity: 1;
  }
`;

const ListItem = styled.li`
  list-style: none;
  font-family: Inter;
  font-style: normal;
  font-weight: 500;
  font-size: 15px;
  line-height: 18px;
  padding-top: 10px;
  padding-bottom: 10px;
`;

class TopBarMobileMenu extends React.Component {
  render() {
    return (
      this.props.showMobileMenu && (
        <Container
          bg="white.full"
          width="100%"
          position="absolute"
          right={[0, 16]}
          top={[69, 75]}
          zIndex={3000}
          data-cy="user-menu"
        >
          <Box as="ul" pl={15}>
            <ListItem route="discover" passHref>
              <FormattedMessage id="menu.discover" defaultMessage="Discover" />
            </ListItem>
            <Link route="marketing" params={{ pageSlug: 'how-it-works' }} passHref>
              <ListItem>
                <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
              </ListItem>
            </Link>
            <Link route="pricing" passHref>
              <ListItem>
                <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
              </ListItem>
            </Link>
            <ListItem href="https://docs.opencollective.com">
              <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />
            </ListItem>
          </Box>
          <Container
            display="flex"
            justifyContent="space-evenly"
            alignItems="center"
            width={1}
            my={3}
            order={['2', null, '3']}
            maxWidth="300px"
          >
            <SocialLink href="https://blog.opencollective.com/">
              <Blog size={17} color="#9399A3" />
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
        </Container>
      )
    );
  }
}

TopBarMobileMenu.propTypes = {
  showMobileMenu: PropTypes.bool,
};

export default injectIntl(withUser(TopBarMobileMenu));
