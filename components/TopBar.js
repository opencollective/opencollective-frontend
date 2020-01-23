import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import SearchIcon from './SearchIcon';
import TopBarProfileMenu from './TopBarProfileMenu';
import SearchForm from './SearchForm';
import { FormattedMessage } from 'react-intl';
import { Link } from '../server/pages';

import Hide from './Hide';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';

import { rotateMixin } from '../lib/constants/animations';
import { withUser } from './UserProvider';
import theme from '../lib/theme';

const Logo = styled.img.attrs({
  src: '/static/images/opencollective-logo-new.svg',
  alt: 'Open Collective logo',
})`
  ${({ animate }) => (animate ? rotateMixin : null)};
`;

const SearchFormContainer = styled(Box)`
  max-width: 30rem;
  min-width: 10rem;
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

const NavLink = styled.a`
  color: ${themeGet('colors.black.800')};
  font-size: 14px;
  line-height: 24px;
  letter-spacing: -0.016em;

  &:hover {
    color: rgba(255, 255, 255, 0.7);
  }
`;

class TopBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    loadingLoggedInUser: PropTypes.bool,
    showSearch: PropTypes.bool,
    menuItems: PropTypes.object,
  };

  static defaultProps = {
    className: '',
    showSearch: true,
    menuItems: {
      discover: true,
      docs: true,
      howItWorks: false,
      pricing: false,
    },
  };

  render() {
    const { showSearch, menuItems } = this.props;
    const defaultMenu = { discover: true, docs: true, howItWorks: false, pricing: false };
    const merged = { ...defaultMenu, ...menuItems };
    return (
      <Flex
        px={3}
        py={showSearch ? 2 : 3}
        alignItems="center"
        justifyContent="space-between"
        flexDirection="row"
        css={{ height: theme.sizes.navbarHeight }}
      >
        <Link route="home" passHref>
          <Flex as="a" alignItems="center">
            <Hide xs>
              <Logo />
            </Hide>
            <Hide sm md lg>
              <img src="/static/images/oc-logo-icon-newhomepage.svg" />
            </Hide>
          </Flex>
        </Link>

        <Flex alignItems="center">
          {showSearch && (
            <Flex justifyContent="center" flex="1 1 auto">
              <Hide xs width={1}>
                <SearchFormContainer p={2} width={[null, null, '280px', null, '288px']}>
                  <SearchForm />
                </SearchFormContainer>
              </Hide>
            </Flex>
          )}

          <Hide sm md lg>
            <Box mx={3}>
              <Link href="/search">
                <Flex as="a">
                  <SearchIcon fill="#aaaaaa" size={24} />
                </Flex>
              </Link>
            </Box>
          </Hide>

          <Hide sm md lg>
            <Box mx={3}>
              <Link href="#footer">
                <Flex as="a">
                  <MenuIcon color="#aaaaaa" size={24} />
                </Flex>
              </Link>
            </Box>
          </Hide>

          <Hide xs sm>
            <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
              {merged.discover && (
                <NavLinkContainer>
                  <Link route="discover" passHref>
                    <NavLink>
                      <FormattedMessage id="menu.discover" defaultMessage="Discover" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
              {merged.howItWorks && (
                <NavLinkContainer>
                  <Link route="marketing" params={{ pageSlug: 'how-it-works' }} passHref>
                    <NavLink>
                      <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
              {merged.pricing && (
                <NavLinkContainer>
                  <NavLink href="https://docs.opencollective.com/help/about/pricing">
                    <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
                  </NavLink>
                </NavLinkContainer>
              )}
              {merged.docs && (
                <NavLinkContainer>
                  <NavLink href="https://docs.opencollective.com">
                    <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />
                  </NavLink>
                </NavLinkContainer>
              )}
            </NavList>
          </Hide>
        </Flex>
        <TopBarProfileMenu />
      </Flex>
    );
  }
}

export default withUser(TopBar);
