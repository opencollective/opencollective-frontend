import React from 'react';
import PropTypes from 'prop-types';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { rotateMixin } from '../lib/constants/animations';
import theme from '../lib/theme';

import ChangelogTrigger from './changelog/ChangelogTrigger';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Image from './Image';
import Link from './Link';
import SearchIcon from './SearchIcon';
import StyledLink from './StyledLink';
import TopBarMobileMenu from './TopBarMobileMenu';
import TopBarProfileMenu from './TopBarProfileMenu';

const Logo = styled.img.attrs({
  src: '/static/images/opencollective-icon.svg',
  alt: 'Open Collective logo',
})`
  ${({ animate }) => (animate ? rotateMixin : null)};
`;

const NavList = styled(Flex)`
  list-style: none;
  min-width: 20rem;
  text-align: right;
  align-items: center;
`;

const NavLinkContainer = styled(Box)`
  text-align: center;
`;
NavLinkContainer.defaultProps = {
  as: 'li',
  px: [1, 2, 3],
};

const NavLink = styled(StyledLink)`
  color: #313233;
  font-weight: 500;
  font-size: 1.4rem;
`;

class TopBar extends React.Component {
  static propTypes = {
    menuItems: PropTypes.object,
  };

  static defaultProps = {
    menuItems: {
      discover: true,
      docs: true,
      howItWorks: false,
      pricing: false,
    },
  };

  constructor(props) {
    super(props);
    this.state = { showMobileMenu: false };
    this.ref = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('click', this.onClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutside);
  }

  onClickOutside = e => {
    const ref = this.ref.current;
    if (this.state.showMobileMenu && ref && !ref.contains(e.target)) {
      this.setState({ showMobileMenu: false });
    }
  };

  toggleMobileMenu = () => {
    this.setState(state => ({ showMobileMenu: !state.showMobileMenu }));
  };

  render() {
    const { menuItems } = this.props;
    const defaultMenu = { docs: true, howItWorks: false, pricing: false };
    const merged = { ...defaultMenu, ...menuItems };
    return (
      <Flex
        px={3}
        py={3}
        alignItems="center"
        flexDirection="row"
        justifyContent="space-around"
        css={{ height: theme.sizes.navbarHeight, background: 'white' }}
        ref={this.ref}
      >
        <Link href="/">
          <Flex alignItems="center">
            <Logo width="36" height="36" />
            <Hide xs>
              <Box mx={2}>
                <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open Collective" />
              </Box>
            </Hide>
          </Flex>
        </Link>

        <Flex alignItems="center" justifyContent={['flex-end', 'center']} flex="1 1 auto">
          <Box mx={3}>
            <Link href="/search">
              <Flex>
                <SearchIcon fill="#75777A" size={18} />
              </Flex>
            </Link>
          </Box>

          <Hide xs>
            <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
              {merged.howItWorks && (
                <NavLinkContainer>
                  <Link href="/how-it-works">
                    <NavLink as={Container}>
                      <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
              {merged.pricing && (
                <NavLinkContainer>
                  <Link href="/pricing">
                    <NavLink as={Container}>
                      <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
              {merged.docs && (
                <NavLinkContainer>
                  <NavLink href="/help">
                    <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />
                  </NavLink>
                </NavLinkContainer>
              )}
            </NavList>
          </Hide>
        </Flex>
        <Container mr={3}>
          <Hide xs>
            <ChangelogTrigger />
          </Hide>
        </Container>
        <TopBarProfileMenu />
        <Hide sm md lg>
          <TopBarMobileMenu
            showMobileMenu={this.state.showMobileMenu}
            menuItems={merged}
            closeMenu={this.toggleMobileMenu}
          />
          <Box mx={3} onClick={this.toggleMobileMenu}>
            <Flex as="a">
              <MenuIcon color="#aaaaaa" size={24} />
            </Flex>
          </Box>
        </Hide>
      </Flex>
    );
  }
}

export default TopBar;
