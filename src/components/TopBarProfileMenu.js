import React from 'react';
import PropTypes from 'prop-types';
import { Link } from '../server/pages';
import { FormattedMessage, defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { formatCurrency, capitalize } from '../lib/utils';
import { Badge } from 'react-bootstrap';
import { get, uniqBy } from 'lodash';
import styled from 'styled-components';
import {
  backgroundImage,
  bgColor,
  border,
  borderRadius,
  display,
  size,
  space,
} from 'styled-system';
import { Box, Flex } from 'grid-styled';
import Hide from './Hide';
import { P } from './Text';
import Caret from './Caret';
import StyledLink from './StyledLink';
import ListItem from './ListItem';
import Container from './Container';

const Avatar = styled.div`
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  overflow: hidden;

  ${bgColor}
  ${backgroundImage}
  ${border}
  ${borderRadius}
  ${display}
  ${size}
  ${space}
`;

class TopBarProfileMenu extends React.Component {

  static propTypes = {
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = { showProfileMenu: false, loading: true };
    this.messages = defineMessages({
      'tooltip.balance': { id: 'profilemenu.memberships.tooltip.balance', defaultMessage: 'Balance {balance}' },
      'tooltip.pendingExpenses': { id: 'profilemenu.memberships.tooltip.pendingExpenses', defaultMessage: '{n} pending expenses' },
      'menu.transactions': { id: 'menu.transactions', defaultMessage: 'transactions' }
    });
  }

  componentDidMount() {
    document.addEventListener('click', this.onClickOutside);
    if (typeof window !== 'undefined') {
      this.redirectAfterSignin = window.location.href.replace(/^https?:\/\/[^/]+/,'');
      if (!window.localStorage.accessToken) {
        this.setState({ loading: false })
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onClickOutside);
  }

  logout = () => {
    this.setState({ showProfileMenu: false, status: 'loggingout' })
    window.localStorage.removeItem('accessToken');
    window.localStorage.removeItem('LoggedInUser');
    window.location.reload();
  }

  onClickOutside = () => {
    this.setState({ showProfileMenu: false });
  }

  toggleProfileMenu = (e) => {
    this.setState({ showProfileMenu: !this.state.showProfileMenu });
    // don't propagate to onClickOutside
    e.nativeEvent.stopImmediatePropagation();
  }

  tooltip(membership) {
    const { intl } = this.props;
    const { collective } = membership;
    const balance = get(collective, 'stats.balance');
    let str = intl.formatMessage(this.messages['tooltip.balance'], { balance: formatCurrency(balance, collective.currency) });
    const pendingExpenses = get(collective, 'stats.expenses.pending');
    if (pendingExpenses > 0) {
      str += ` - ${intl.formatMessage(this.messages['tooltip.pendingExpenses'], { n: pendingExpenses })}`;
    }
    return str;
  }

  renderProfileMenu() {
    const { LoggedInUser, intl } = this.props;
    const score = (c) => {
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
    }
    const collectives = uniqBy([ ...LoggedInUser.memberOf.filter(m => m.collective.type === 'COLLECTIVE') ], m => m.collective.id).sort((a, b) => {
      return (`${score(a)}-${a.collective.slug}` > `${score(b)}-${b.collective.slug}`) ? 1 : -1
    }); // order by role then az

    const orgs = uniqBy([ ...LoggedInUser.memberOf.filter(m => m.collective.type === 'ORGANIZATION') ], m => m.collective.id).sort((a, b) => {
      return (`${score(a)}-${a.collective.slug}` > `${score(b)}-${b.collective.slug}`) ? 1 : -1
    }); // order by role then az

    return (
      <Container
        bg="white"
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
          <Flex alignItems="center" >
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
            <Container height="0.1rem" bg="#E6E6E6" w={1} minWidth={50} />
            <Link route="/create">
              <StyledLink border="1px solid #D5DAE0" borderRadius="20px" px={2} py={1} color="#6E747A" display="inline-block" ml={2} fontSize="1rem" whiteSpace="nowrap">+ New</StyledLink>
            </Link>
          </Flex>
          <Box is="ul" p={0} my={2}>
            {collectives.map(membership => (
              <ListItem py={1} key={`LoggedInMenu-Collective-${get(membership, 'collective.slug')}`}>
                <Link route={`/${get(membership, 'collective.slug')}`}>
                  <StyledLink title={this.tooltip(membership)} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial" fontWeight="400">
                    <Flex alignItems="center">
                      <Avatar backgroundImage={get(membership, 'collective.image')} size="2.8rem" borderRadius="3px" border="1px solid rgba(18,19,20,0.12)" mr={2} />
                      {get(membership, 'collective.slug')}
                    </Flex>
                  </StyledLink>
                </Link>
                { get(membership, 'collective.stats.expenses.pending') > 0 && <Badge>{get(membership, 'collective.stats.expenses.pending')}</Badge> }
              </ListItem>
            ))}
          </Box>

          <Flex alignItems="center" mt={3} >
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
            <Container height="0.1rem" bg="#E6E6E6" w={1} minWidth={50} />
            <Link route="/organizations/new">
              <StyledLink border="1px solid #D5DAE0" borderRadius="20px" px={2} py={1} color="#6E747A" display="inline-block" ml={2} fontSize="1rem" whiteSpace="nowrap">+ New</StyledLink>
            </Link>
          </Flex>
          <Box is="ul" p={0} my={2}>
            {orgs.map(membership => (
              <ListItem py={1} key={`LoggedInMenu-Collective-${get(membership, 'collective.slug')}`}>
                <Link route={`/${get(membership, 'collective.slug')}`}>
                  <StyledLink title={this.tooltip(membership)} color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial" fontWeight="400">
                    <Flex alignItems="center">
                      <Avatar backgroundImage={get(membership, 'collective.image')} size="2.8rem" borderRadius="3px" border="1px solid rgba(18,19,20,0.12)" mr={2} />
                      {get(membership, 'collective.slug')}
                    </Flex>
                  </StyledLink>
                </Link>
                { get(membership, 'collective.stats.expenses.pending') > 0 && <Badge>{get(membership, 'collective.stats.expenses.pending')}</Badge> }
              </ListItem>
            ))}
          </Box>
          {orgs.length === 0 && (
            <Box my={2}>
              <P color="#9399A3" fontSize="1rem" letterSpacing="0.5px"><em>No organizations yet</em></P>
            </Box>
          )}
        </Container>
        <Container height="0.1rem" bg="#E6E6E6" w={1} />
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
              <Link route="collective" params={{slug: LoggedInUser.username}}>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  <FormattedMessage id="menu.profile" defaultMessage="Profile" />
                </StyledLink>
              </Link>
            </ListItem>
            <ListItem py={1}>
              <Link route="subscriptions" params={{collectiveSlug: LoggedInUser.username}}>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  <FormattedMessage id="menu.subscriptions" defaultMessage="Subscriptions" />
                </StyledLink>
              </Link>
            </ListItem>
            <ListItem py={1}>
              <Link route="transactions" params={{collectiveSlug: LoggedInUser.username}}>
                <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial">
                  { capitalize(intl.formatMessage(this.messages['menu.transactions'])) }
                </StyledLink>
              </Link>
            </ListItem>
            <ListItem py={1}>
              <StyledLink color="#494D52" fontSize="1.2rem" fontFamily="montserratlight, arial" onClick={this.logout}>
                <FormattedMessage id="menu.logout" defaultMessage="logout" />
              </StyledLink>
            </ListItem>
          </Box>
        </Container>
      </Container>
    )
  }

  renderLoggedInUser() {
    const { showProfileMenu } = this.state;
    const { LoggedInUser } = this.props;

    return (
      <Flex alignItems="center" onClick={this.toggleProfileMenu}>
        {LoggedInUser.image && (
          <Avatar
            backgroundColor="#FDFDFD"
            backgroundImage={LoggedInUser.image}
            borderRadius="100%"
            display="inline-block"
            size="2.6rem"
            mr={2}
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
          >
            {LoggedInUser.username}
          </P>
        </Hide>
        <Caret color="#46b0ed" display="inline-block" height="0.6rem" strokeWidth="0.2rem" width="1.4rem" />
        {showProfileMenu && this.renderProfileMenu()}
      </Flex>
    )
  }

  render() {

    const { loading } = this.state;
    const { LoggedInUser } = this.props;

    let status;
    if (this.state.status) {
      status = this.state.status;
    } else if (loading && typeof LoggedInUser === 'undefined') {
      status = 'loading';
    } else if (!LoggedInUser) {
      status = 'loggedout';
    } else {
      status = 'loggedin';
    }

    return (
      <div className="LoginTopBarProfileButton">
        { status === 'loading' &&
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block"><FormattedMessage id="loading" defaultMessage="loading" />&hellip;</P>
        }

        { status === 'loggingout' &&
          <P color="#D5DAE0" fontSize="1.4rem" px={3} py={2} display="inline-block"><FormattedMessage id="loggingout" defaultMessage="logging out" />&hellip;</P>
        }

        { status === 'loggedout' &&
          <Link route="signin" params={{ next: this.redirectAfterSignin }}>
            <StyledLink
              border="1px solid #D5DAE0"
              borderRadius="20px"
              color="#3385FF"
              display="inline-block"
              fontSize="1.4rem"
              hover={{ cursor: 'pointer' }}
              px={3}
              py={2}
            >
              <FormattedMessage id="login.button" defaultMessage="Login" />
            </StyledLink>
          </Link>
        }

        { status === 'loggedin' && this.renderLoggedInUser() }
      </div>
    )

  }
}

export default withIntl(TopBarProfileMenu);
