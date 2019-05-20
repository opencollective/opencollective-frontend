import React from 'react';
import PropTypes from 'prop-types';
import { Bars as MenuIcon } from 'styled-icons/fa-solid/Bars';
import SearchIcon from './SearchIcon';
import TopBarProfileMenu from './TopBarProfileMenu';
import SearchForm from './SearchForm';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { Link } from '../server/pages';

import Hide from './Hide';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';

import { rotateMixin } from '../constants/animations';
import { withUser } from './UserProvider';
import theme from '../constants/theme';

const Logo = styled.img.attrs({
  src: '/static/images/opencollective-icon.svg',
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
  color: #777777;
  font-size: 1.4rem;
`;

class TopBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    loadingLoggedInUser: PropTypes.bool,
    showSearch: PropTypes.bool,
  };

  static defaultProps = {
    className: '',
    showSearch: true,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'menu.homepage': {
        id: 'menu.homepage',
        defaultMessage: 'Go to Open Collective Homepage',
      },
    });
  }

  render() {
    const { className, loadingLoggedInUser, showSearch } = this.props;
    const shouldAnimate = (Array.isArray(className) && className.includes('loading')) || loadingLoggedInUser;

    return (
      <Flex
        px={3}
        py={showSearch ? 2 : 3}
        alignItems="center"
        flexDirection="row"
        justifyContent="space-around"
        css={{ height: theme.sizes.navbarHeight }}
      >
        <Link route="home" passHref>
          <Flex as="a" alignItems="center">
            <Logo width="24" height="24" animate={shouldAnimate} />
            <Hide xs>
              <Box mx={2}>
                <img height="16px" src="/static/images/logotype.svg" />
              </Box>
            </Hide>
          </Flex>
        </Link>

        {showSearch && (
          <Flex justifyContent="center" flex="1 1 auto">
            <Hide xs width={1}>
              <SearchFormContainer p={2}>
                <SearchForm />
              </SearchFormContainer>
            </Hide>
          </Flex>
        )}

        <Flex alignItems="center" justifyContent="flex-end" flex="1 1 auto">
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

          <Hide xs>
            <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
              <NavLinkContainer>
                <Link route="discover" passHref>
                  <NavLink>
                    <FormattedMessage id="menu.discover" defaultMessage="Discover" />
                  </NavLink>
                </Link>
              </NavLinkContainer>
              <NavLinkContainer>
                <Link route="marketing" params={{ pageSlug: 'how-it-works' }} passHref>
                  <NavLink>
                    <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />
                  </NavLink>
                </Link>
              </NavLinkContainer>
              <NavLinkContainer>
                <NavLink href="/pricing">
                  <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />
                </NavLink>
              </NavLinkContainer>
              <NavLinkContainer>
                <NavLink href="https://docs.opencollective.com">
                  <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />
                </NavLink>
              </NavLinkContainer>
            </NavList>
          </Hide>

          <TopBarProfileMenu />
        </Flex>
      </Flex>
    );
  }
}

export default withIntl(withUser(TopBar));
