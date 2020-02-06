import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { get, uniqBy } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';

import { Settings } from '@styled-icons/feather/Settings';

import { Link } from '../server/pages';
import { formatCurrency, capitalize } from '../lib/utils';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { withUser } from './UserProvider';
import Avatar from './Avatar';
import Hide from './Hide';
import { P } from './Text';
import StyledLink from './StyledLink';
import ListItem from './ListItem';
import Container from './Container';
import LoginBtn from './LoginBtn';

class TopBarProfileMenu extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
    logout: PropTypes.func,
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false, loading: true };
    this.messages = defineMessages({
      'tooltip.balance': {
        id: 'profilemenu.memberships.tooltip.balance',
        defaultMessage: 'Balance {balance}',
      },
      'tooltip.pendingExpenses': {
        id: 'profilemenu.memberships.tooltip.pendingExpenses',
        defaultMessage: '{n} pending expenses',
      },
      'menu.transactions': {
        id: 'menu.transactions',
        defaultMessage: 'transactions',
      },
      'menu.applications': {
        id: 'menu.applications',
        defaultMessage: 'applications',
      },
      settings: {
        id: 'Settings',
        defaultMessage: 'Settings',
      },
    });
  }

  componentDidMount() {
    document.addEventListener('click', this.onClickOutside);
    if (!getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN)) {
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutside);
  }

  logout = () => {
    this.setState({ showProfileMenu: false, status: 'loggingout' });
    this.props.logout();
    this.setState({ status: 'loggedout' });
  };

  onClickOutside = () => {
    this.setState({ showProfileMenu: false });
  };

  toggleProfileMenu = e => {
    this.setState({ showProfileMenu: !this.state.showProfileMenu });
    // don't propagate to onClickOutside
    e.nativeEvent.stopImmediatePropagation();
  };

  tooltip(membership) {
    const { intl } = this.props;
    const { collective } = membership;
    const balance = get(collective, 'stats.balance');
    let str = intl.formatMessage(this.messages['tooltip.balance'], {
      balance: formatCurrency(balance, collective.currency),
    });
    const pendingExpenses = get(collective, 'stats.expenses.pending');
    if (pendingExpenses > 0) {
      str += ` - ${intl.formatMessage(this.messages['tooltip.pendingExpenses'], { n: pendingExpenses })}`;
    }
    return str;
  }

  renderMembershipLine = membership => {
    const { intl, LoggedInUser } = this.props;
    const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(membership.collective);
    return (
      <ListItem
        key={`LoggedInMenu-Collective-${get(membership, 'collective.slug')}`}
        py={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Link route={`/${get(membership, 'collective.slug')}`} passHref>
          <StyledLink
            title={this.tooltip(membership)}
            color="black.700"
            fontSize="1.2rem"
            fontFamily="montserratlight, arial"
            fontWeight="400"
            truncateOverflow
            maxWidth="90%"
          >
            <Flex alignItems="center">
              <Avatar collective={get(membership, 'collective')} radius="2.8rem" mr={2} />
              <P fontSize="Caption" truncateOverflow>
                {get(membership, 'collective.name')}
              </P>
            </Flex>
          </StyledLink>
        </Link>
        {isAdmin && (
          <Link route="editCollective" params={{ slug: membership.collective.slug }} passHref>
            <StyledLink color="black.500" title={intl.formatMessage(this.messages.settings)}>
              <Settings size="1.2em" />
            </StyledLink>
          </Link>
        )}
      </ListItem>
    );
  };

  renderProfileMenu() {
    const { LoggedInUser, intl } = this.props;

    const memberships = uniqBy(
      LoggedInUser.memberOf.filter(m => m.role !== 'BACKER'),
      m => m.collective.id,
    );

    const incognitoProfileMembership = memberships.find(m => m.collective.isIncognito);

    const collectives = memberships
      .filter(m => m.collective.type === 'COLLECTIVE')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    const orgs = memberships
      .filter(m => m.collective.type === 'ORGANIZATION')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    return (
      <Container
        bg="white.full"
        border="1px solid rgba(18,19,20,0.12)"
        borderRadius="12px"
        boxShadow="0 4px 8px 0 rgba(61,82,102,0.08)"
        minWidth="170px"
        maxWidth="300px"
        position="absolute"
        right={16}
        top={40}
        width="max-content"
        zIndex={3000}
        data-cy="user-menu"
      >
        <Container p={3}>
          <Flex alignItems="center">
            <P
              color="#B4BBBF"
              fontFamily="montserratlight, arial"
              fontSize="1rem"
              fontWeight="400"
              letterSpacing="1px"
              pr={2}
              textTransform="uppercase"
              whiteSpace="nowrap"
            >
              <FormattedMessage id="collective" defaultMessage="my collectives" />
            </P>
            <Container height="0.1rem" bg="#E6E6E6" width={1} minWidth={50} />
            <Link route="/create" passHref>
              <StyledLink buttonStyle="standard" buttonSize="small" display="inline-block" ml={2} whiteSpace="nowrap">
                + <FormattedMessage id="Collective.New" defaultMessage="New" />
              </StyledLink>
            </Link>
          </Flex>
          <Box as="ul" p={0} my={2}>
            {collectives.map(this.renderMembershipLine)}
          </Box>
          {collectives.length === 0 && (
            <Box my={2}>
              <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px">
                <em>
                  <FormattedMessage id="menu.collective.none" defaultMessage="No collectives yet" />
                </em>
              </P>
            </Box>
          )}

          <Flex alignItems="center" mt={3}>
            <P
              color="#B4BBBF"
              fontFamily="montserratlight, arial"
              fontSize="1rem"
              fontWeight="400"
              letterSpacing="1px"
              pr={2}
              textTransform="uppercase"
              whiteSpace="nowrap"
            >
              <FormattedMessage id="organization" defaultMessage="my organizations" />
            </P>
            <Container height="0.1rem" bg="#E6E6E6" width={1} minWidth={50} />
            <Link route="/organizations/new" passHref>
              <StyledLink buttonStyle="standard" buttonSize="small" display="inline-block" ml={2} whiteSpace="nowrap">
                + <FormattedMessage id="Organization.New" defaultMessage="New" />
              </StyledLink>
            </Link>
          </Flex>
          <Box as="ul" p={0} my={2}>
            {orgs.map(this.renderMembershipLine)}
          </Box>
          {orgs.length === 0 && (
            <Box my={2}>
              <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px">
                <em>
                  <FormattedMessage id="menu.organizations.none" defaultMessage="No organizations yet" />
                </em>
              </P>
            </Box>
          )}
        </Container>
        <Container height="0.1rem" bg="#E6E6E6" width={1} />
        <Container p={[3]}>
          <P
            color="#B4BBBF"
            fontFamily="montserratlight, arial"
            fontSize="1rem"
            fontWeight="400"
            letterSpacing="1px"
            textTransform="uppercase"
          >
            <FormattedMessage id="menu.myAccount" defaultMessage="My account" />
          </P>
          <Box as="ul" p={0} my={2}>
            <ListItem py={1}>
              <Link route="collective" params={{ slug: LoggedInUser.username }} passHref>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  <FormattedMessage id="menu.profile" defaultMessage="Profile" />
                </StyledLink>
              </Link>
            </ListItem>
            {incognitoProfileMembership && (
              <ListItem py={1}>
                <Link
                  route="subscriptions"
                  params={{ collectiveSlug: incognitoProfileMembership.collective.slug }}
                  passHref
                >
                  <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                    <FormattedMessage
                      id="menu.incognitoProfileSubscriptions"
                      defaultMessage="Manage incognito Contributions"
                    />
                  </StyledLink>
                </Link>
              </ListItem>
            )}
            <ListItem py={1}>
              <Link route="subscriptions" params={{ collectiveSlug: LoggedInUser.username }} passHref>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  <FormattedMessage id="menu.subscriptions" defaultMessage="Manage Contributions" />
                </StyledLink>
              </Link>
            </ListItem>
            <ListItem py={1}>
              <Link route="transactions" params={{ collectiveSlug: LoggedInUser.username }} passHref>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  {capitalize(intl.formatMessage(this.messages['menu.transactions']))}
                </StyledLink>
              </Link>
            </ListItem>
            <ListItem py={1}>
              <Link route="applications" passHref>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  {capitalize(intl.formatMessage(this.messages['menu.applications']))}
                </StyledLink>
              </Link>
            </ListItem>
            <ListItem py={1}>
              <StyledLink
                color="#494D52"
                fontSize="1.2rem"
                fontFamily="montserratlight, arial"
                href="https://docs.opencollective.com"
              >
                <FormattedMessage id="menu.help" defaultMessage="Help" />
              </StyledLink>
            </ListItem>
            <ListItem py={1}>
              <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial" onClick={this.logout}>
                <FormattedMessage id="menu.logout" defaultMessage="Log out" />
              </StyledLink>
            </ListItem>
          </Box>
        </Container>
      </Container>
    );
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;

    return (
      <Flex alignItems="center" onClick={this.toggleProfileMenu} data-cy="user-menu-trigger">
        <Avatar collective={get(LoggedInUser, 'collective')} radius="3rem" mr={2} />
        <Hide xs sm>
          <P
            color="#46b0ed"
            display="inline-block"
            fontSize="1.2rem"
            fontWeight="bold"
            letterSpacing="1px"
            mx={2}
            className="LoginTopBarProfileButton-name"
            cursor="pointer"
            data-cy="topbar-login-username"
          >
            {LoggedInUser.username}
          </P>
        </Hide>
        <ChevronDown color="#46b0ed" size="1.5em" cursor="pointer" />
        {showProfileMenu && this.renderProfileMenu()}
      </Flex>
    );
  }

  render() {
    const { loading } = this.state;
    const { LoggedInUser, loadingLoggedInUser } = this.props;

    let status;
    if (this.state.status) {
      status = this.state.status;
    } else if ((loading || loadingLoggedInUser) && typeof LoggedInUser === 'undefined') {
      status = 'loading';
    } else if (!LoggedInUser) {
      status = 'loggedout';
    } else {
      status = 'loggedin';
    }

    return (
      <div className="LoginTopBarProfileButton">
        {status === 'loading' && (
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block">
            <FormattedMessage id="loading" defaultMessage="loading" />
            &hellip;
          </P>
        )}

        {status === 'loggingout' && (
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block">
            <FormattedMessage id="loggingout" defaultMessage="logging out" />
            &hellip;
          </P>
        )}

        {status === 'loggedout' && <LoginBtn />}

        {status === 'loggedin' && this.renderLoggedInUser()}
      </div>
    );
  }
}

export default injectIntl(withUser(TopBarProfileMenu));
