import React from 'react';
import PropTypes from 'prop-types';
import { Github } from '@styled-icons/fa-brands/Github';
import { Slack } from '@styled-icons/fa-brands/Slack';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { Blog } from '@styled-icons/icomoon/Blog';
import { Mail } from '@styled-icons/material/Mail';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import Container from './Container';
import { Box } from './Grid';
import Link from './Link';
import StyledLink from './StyledLink';
import StyledRoundButton from './StyledRoundButton';
import { withUser } from './UserProvider';

const ListItem = styled.li`
  list-style: none;
  font-family: Inter;
  font-style: normal;
  font-weight: 500;
  font-size: 15px;
  line-height: 18px;
  padding-top: 10px;
  padding-bottom: 10px;
  a:not(:hover) {
    color: #313233;
  }
`;

class TopBarMobileMenu extends React.Component {
  render() {
    const { showMobileMenu, menuItems, closeMenu } = this.props;

    if (!showMobileMenu) {
      return null;
    }

    return (
      <Container
        bg="white.full"
        width="100%"
        position="absolute"
        right={[0, 16]}
        top={[69, 75]}
        p={3}
        zIndex={3000}
        borderRadius="0px 0px 16px 16px"
        boxShadow="0px 8px 12px rgba(20, 20, 20, 0.16)"
        data-cy="user-menu"
      >
        <Box as="ul" my={2} pl={0}>
          {menuItems.discover && (
            <ListItem>
              <Link href="/discover" onClick={closeMenu}>
                <FormattedMessage id="menu.discover" defaultMessage="Discover" />
              </Link>
            </ListItem>
          )}
          {menuItems.howItWorks && (
            <ListItem>
              <Link href="/how-it-works" onClick={closeMenu}>
                <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
              </Link>
            </ListItem>
          )}
          {menuItems.pricing && (
            <ListItem>
              <Link href="/pricing" onClick={closeMenu}>
                <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
              </Link>
            </ListItem>
          )}
          {menuItems.docs && (
            <ListItem>
              <a href="https://docs.opencollective.com" onClick={closeMenu}>
                <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />
              </a>
            </ListItem>
          )}
        </Box>
        <Container
          display="flex"
          alignItems="center"
          width={1}
          p={2}
          order={['2', null, '3']}
          borderRadius={16}
          background="#F7F8FA"
        >
          <StyledLink href="https://blog.opencollective.com/" openInNewTab onClick={closeMenu}>
            <StyledRoundButton size={40} mr={2}>
              <Blog size={17} color="#9D9FA3" />
            </StyledRoundButton>
          </StyledLink>
          <StyledLink href="https://twitter.com/opencollect" openInNewTab onClick={closeMenu}>
            <StyledRoundButton size={40} mr={2}>
              <Twitter size={17} color="#9D9FA3" />
            </StyledRoundButton>
          </StyledLink>
          <StyledLink href="https://github.com/opencollective" openInNewTab onClick={closeMenu}>
            <StyledRoundButton size={40} mr={2}>
              <Github size={17} color="#9D9FA3" />
            </StyledRoundButton>
          </StyledLink>
          <StyledLink href="https://slack.opencollective.com" openInNewTab onClick={closeMenu}>
            <StyledRoundButton size={40} mr={2}>
              <Slack size={17} color="#9D9FA3" />
            </StyledRoundButton>
          </StyledLink>
          <StyledLink href="mailto:info@opencollective.com" openInNewTab onClick={closeMenu}>
            <StyledRoundButton size={40} mr={2}>
              <Mail size={19} color="#9D9FA3" />
            </StyledRoundButton>
          </StyledLink>
        </Container>
      </Container>
    );
  }
}

TopBarMobileMenu.propTypes = {
  showMobileMenu: PropTypes.bool,
  menuItems: PropTypes.object,
  closeMenu: PropTypes.func,
};

export default injectIntl(withUser(TopBarMobileMenu));
