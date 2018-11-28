import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '../server/pages';
import { FormattedMessage, defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { withUser } from './UserProvider';
import { formatCurrency, capitalize } from '../lib/utils';
import { Badge } from 'react-bootstrap';
import { get, uniqBy } from 'lodash';
import { Box, Flex } from 'grid-styled';
import Avatar from './Avatar';
import Hide from './Hide';
import { P } from './Text';
import Caret from './Caret';
import StyledLink from './StyledLink';
import ListItem from './ListItem';
import Container from './Container';
import LoginBtn from './LoginBtn';

class TopBarProfileMenu extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
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
    });
  }

  componentDidMount() {
    document.addEventListener('click', this.onClickOutside);
    if (typeof window !== 'undefined') {
      if (!window.localStorage.accessToken) {
        this.setState({ loading: false });
      }
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

  renderProfileMenu() {
    const { LoggedInUser, intl } = this.props;
    const score = c => {
      switch (c.role) {
        case 'HOST':
          return 0;
        case 'ADMIN':
          return 1;
        case 'MEMBER':
          return 2;
        case 'BACKER':
          return 3;
      }
    };
    const collectives = uniqBy(
      [...LoggedInUser.memberOf.filter(m => m.collective.type === 'COLLECTIVE')],
      m => m.collective.id,
    ).sort((a, b) => {
      return `${score(a)}-${a.collective.slug}` > `${score(b)}-${b.collective.slug}` ? 1 : -1;
    }); // order by role then az

    const orgs = uniqBy(
      [...LoggedInUser.memberOf.filter(m => m.collective.type === 'ORGANIZATION')],
      m => m.collective.id,
    ).sort((a, b) => {
      return `${score(a)}-${a.collective.slug}` > `${score(b)}-${b.collective.slug}` ? 1 : -1;
    }); // order by role then az

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
                + New
              </StyledLink>
            </Link>
          </Flex>
          <Box is="ul" p={0} my={2}>
            {collectives.map(membership => (
              <ListItem py={1} key={`LoggedInMenu-Collective-${get(membership, 'collective.slug')}`}>
                <Link route={`/${get(membership, 'collective.slug')}`} passHref>
                  <StyledLink
                    title={this.tooltip(membership)}
                    color="#494D52"
                    fontSize="1.2rem"
                    fontFamily="montserratlight, arial"
                    fontWeight="400"
                  >
                    <Flex alignItems="center">
                      <Avatar
                        src={get(membership, 'collective.image')}
                        type={get(membership, 'collective.type')}
                        name={get(membership, 'collective.name')}
                        radius="2.8rem"
                        mr={2}
                      />
                      {get(membership, 'collective.slug')}
                    </Flex>
                  </StyledLink>
                </Link>
                {get(membership, 'collective.stats.expenses.pending') > 0 && (
                  <Badge>{get(membership, 'collective.stats.expenses.pending')}</Badge>
                )}
              </ListItem>
            ))}
          </Box>

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
                + New
              </StyledLink>
            </Link>
          </Flex>
          <Box is="ul" p={0} my={2}>
            {orgs.map(membership => (
              <ListItem py={1} key={`LoggedInMenu-Collective-${get(membership, 'collective.slug')}`}>
                <Link route={`/${get(membership, 'collective.slug')}`} passHref>
                  <StyledLink
                    title={this.tooltip(membership)}
                    color="#494D52"
                    fontSize="1.2rem"
                    fontFamily="montserratlight, arial"
                    fontWeight="400"
                  >
                    <Flex alignItems="center">
                      <Avatar
                        src={get(membership, 'collective.image')}
                        type={get(membership, 'collective.type')}
                        name={get(membership, 'collective.name')}
                        radius="2.8rem"
                        mr={2}
                      />
                      {get(membership, 'collective.slug')}
                    </Flex>
                  </StyledLink>
                </Link>
                {get(membership, 'collective.stats.expenses.pending') > 0 && (
                  <Badge>{get(membership, 'collective.stats.expenses.pending')}</Badge>
                )}
              </ListItem>
            ))}
          </Box>
          {orgs.length === 0 && (
            <Box my={2}>
              <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px">
                <em>No organizations yet</em>
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
          <Box is="ul" p={0} my={2}>
            <ListItem py={1}>
              <Link route="collective" params={{ slug: LoggedInUser.username }} passHref>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  <FormattedMessage id="menu.profile" defaultMessage="Profile" />
                </StyledLink>
              </Link>
            </ListItem>
            <ListItem py={1}>
              <Link route="subscriptions" params={{ collectiveSlug: LoggedInUser.username }} passHref>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  <FormattedMessage id="menu.subscriptions" defaultMessage="Subscriptions" />
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
              <Link route="applications" params={{ collectiveSlug: LoggedInUser.username }} passHref>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  {capitalize(intl.formatMessage(this.messages['menu.applications']))}
                </StyledLink>
              </Link>
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
      <Flex alignItems="center" onClick={this.toggleProfileMenu}>
        {LoggedInUser.image && (
          <Avatar
            radius="3rem"
            mr={2}
            src={LoggedInUser.image}
            type={get(LoggedInUser, 'collective.type')}
            name={get(LoggedInUser, 'collective.name')}
          />
        )}
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
          >
            {LoggedInUser.username}
          </P>
        </Hide>
        <Caret
          color="#46b0ed"
          display="inline-block"
          height="0.6rem"
          strokeWidth="0.2rem"
          width="1.4rem"
          cursor="pointer"
        />
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

export default withIntl(withUser(TopBarProfileMenu));
