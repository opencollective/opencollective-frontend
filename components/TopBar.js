import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client/core';
import { graphql } from '@apollo/client/react/hoc';
import { Bars as MenuIcon } from '@styled-icons/fa-solid/Bars';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { rotateMixin } from '../lib/constants/animations';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import theme from '../lib/theme';
import { compose } from '../lib/utils';

import Avatar from './Avatar';
import Container from './Container';
import { Box, Flex } from './Grid';
import Hide from './Hide';
import Image from './Image';
import Link from './Link';
import { withNewsAndUpdates } from './NewsAndUpdatesProvider';
import SearchForm from './SearchForm';
import SearchIcon from './SearchIcon';
import StyledLink from './StyledLink';
import TopBarMobileMenu from './TopBarMobileMenu';
import TopBarProfileMenu from './TopBarProfileMenu';
import { withUser } from './UserProvider';

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

const NavLink = styled(StyledLink)`
  color: #313233;
  font-weight: 500;
  font-size: 1.4rem;
`;

class TopBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    LoggedInUser: PropTypes.object,
    setShowNewsAndUpdates: PropTypes.func,
    loadingLoggedInUser: PropTypes.bool,
    showSearch: PropTypes.bool,
    menuItems: PropTypes.object,
    data: PropTypes.shape({
      account: PropTypes.shape({
        latestChangelogPublishDate: PropTypes.string,
      }),
    }),
    setChangelogViewDate: PropTypes.func,
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

  hasSeenNewChangelogUpdates = (user, latestChangelogDate) => {
    if (!user) {
      return true;
    } else if (!user.changelogViewDate) {
      return false;
    } else {
      return new Date(latestChangelogDate) < new Date(user.changelogViewDate);
    }
  };

  handleShowNewUpdates = async () => {
    this.props.setShowNewsAndUpdates(true);
    await this.props.setChangelogViewDate({ variables: { changelogViewDate: new Date() } });
  };

  render() {
    const { showSearch, menuItems, LoggedInUser, data } = this.props;
    const defaultMenu = { discover: true, docs: true, howItWorks: false, pricing: false };
    const merged = { ...defaultMenu, ...menuItems };
    return (
      <Flex
        px={3}
        py={showSearch ? 2 : 3}
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
                <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open collective" />
              </Box>
            </Hide>
          </Flex>
        </Link>

        {showSearch && (
          <Flex justifyContent="flex-end" flex="1 1 auto">
            <Hide xs sm md>
              <SearchFormContainer p={2}>
                <SearchForm borderRadius="6px" fontSize="14px" py="1px" />
              </SearchFormContainer>
            </Hide>
          </Flex>
        )}

        <Flex alignItems="center" justifyContent={['flex-end', 'flex-start']} flex="1 1 auto">
          <Hide lg>
            <Box mx={3}>
              <Link href="/search">
                <Flex>
                  <SearchIcon fill="#aaaaaa" size={24} />
                </Flex>
              </Link>
            </Box>
          </Hide>

          <Hide xs>
            <NavList as="ul" p={0} m={0} justifyContent="space-around" css="margin: 0;">
              {merged.discover && (
                <NavLinkContainer>
                  <Link href="/discover">
                    <NavLink as={Container}>
                      <FormattedMessage id="menu.discover" defaultMessage="Discover" />
                    </NavLink>
                  </Link>
                </NavLinkContainer>
              )}
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
                  <NavLink href="https://docs.opencollective.com">
                    <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />
                  </NavLink>
                </NavLinkContainer>
              )}
            </NavList>
          </Hide>
        </Flex>
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
        <Flex onClick={this.handleShowNewUpdates}>
          {this.hasSeenNewChangelogUpdates(LoggedInUser, data?.account?.latestChangelogPublishDate) && (
            <Avatar src="/static/images/flame-default.svg" radius="30px" backgroundSize={10} ml={2} />
          )}
          {!this.hasSeenNewChangelogUpdates(LoggedInUser, data?.account?.latestChangelogPublishDate) && (
            <Container>
              <Avatar
                src="/static/images/flame-red.svg"
                radius="30px"
                backgroundSize={10}
                backgroundColor="yellow.100"
                ml={2}
              />
            </Container>
          )}
        </Flex>
      </Flex>
    );
  }
}

const latestChangelogPublishDateQuery = gqlV2/* GraphQL */ `
  query LatestChangeLogPublishDate($collectiveSlug: String) {
    account(slug: $collectiveSlug) {
      id
      latestChangelogPublishDate
    }
  }
`;

const setChangelogViewDateMutation = gql`
  mutation SetChangelogViewDateMutation($changelogViewDate: String!) {
    setChangelogViewDate(changelogViewDate: $changelogViewDate) {
      id
    }
  }
`;

const latestChangelogPublish = graphql(latestChangelogPublishDateQuery, {
  options: {
    context: API_V2_CONTEXT,
    variables: { collectiveSlug: 'opencollective' },
  },
});

const setChangelogViewDate = graphql(setChangelogViewDateMutation, {
  name: 'setChangelogViewDate',
});

const addGraphql = compose(latestChangelogPublish, setChangelogViewDate);

export default withNewsAndUpdates(withUser(addGraphql(TopBar)));
