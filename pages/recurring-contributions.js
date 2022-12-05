import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { css } from '@styled-system/css';
import { groupBy, isEmpty, mapValues, orderBy, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import formatCollectiveType from '../lib/i18n/collective-type';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Avatar from '../components/Avatar';
import CollectiveNavbar from '../components/collective-navbar';
import { Dimensions } from '../components/collective-page/_constants';
import SectionTitle from '../components/collective-page/SectionTitle';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex, Grid } from '../components/Grid';
import Link from '../components/Link';
import Loading from '../components/Loading';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import { recurringContributionsQuery } from '../components/recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../components/recurring-contributions/RecurringContributionsContainer';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import StyledFilters from '../components/StyledFilters';
import StyledHr from '../components/StyledHr';
import { P, Span } from '../components/Text';
import { withUser } from '../components/UserProvider';

const MainContainer = styled(Container)`
  max-width: ${Dimensions.MAX_SECTION_WIDTH}px;
  margin: 0 auto;
`;

const FILTERS = {
  ACTIVE: 'ACTIVE',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  CANCELLED: 'CANCELLED',
};

const I18nFilters = defineMessages({
  [FILTERS.ACTIVE]: {
    id: 'Subscriptions.Active',
    defaultMessage: 'Active',
  },
  [FILTERS.MONTHLY]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [FILTERS.YEARLY]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
  [FILTERS.CANCELLED]: {
    id: 'Subscriptions.Cancelled',
    defaultMessage: 'Cancelled',
  },
});

const MenuEntry = styled(Link)`
  display: flex;
  align-items: center;
  background: white;
  padding: 8px 12px;
  cursor: pointer;
  background: none;
  color: inherit;
  border: none;
  font: inherit;
  outline: inherit;
  width: 100%;
  text-align: left;
  border-radius: 8px;
  font-size: 13px;

  ${props =>
    props.$isActive &&
    css({
      fontWeight: 800,
      backgroundColor: 'primary.100',
    })}

  &:hover {
    background: #f9f9f9;
  }
`;

class recurringContributionsPage extends React.Component {
  static getInitialProps({ query: { slug } }) {
    return { slug };
  }

  static propTypes = {
    slug: PropTypes.string,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object,
    }), // from withData
    intl: PropTypes.object,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { filter: 'ACTIVE' };
  }

  componentDidUpdate() {
    const { slug, data, router } = this.props;
    if (data && !data.loading && !data.account && slug?.startsWith('guest-')) {
      // We used to send links like `/guest-12345/recurring-contributions` by email, which caused troubles when updating the slug.
      // This redirect ensures compatibility with old links byt redirecting them to the unified page.
      // See https://github.com/opencollective/opencollective/issues/4876
      router.replace('/recurring-contributions');
    }
  }

  getAdministratedAccounts = memoizeOne(loggedInUser => {
    // Personal profile already includes incognito contributions
    const adminMemberships = loggedInUser?.memberOf?.filter(m => m.role === 'ADMIN' && !m.collective.isIncognito);
    const uniqMemberships = uniqBy(adminMemberships, 'collective.id');
    const groupedMemberships = groupBy(uniqMemberships, 'collective.type');
    return mapValues(groupedMemberships, memberships => orderBy(memberships, 'collective.name'));
  });

  render() {
    const { slug, data, intl, loadingLoggedInUser, LoggedInUser } = this.props;

    const filters = ['ACTIVE', 'MONTHLY', 'YEARLY', 'CANCELLED'];

    if (!data?.loading && !loadingLoggedInUser && LoggedInUser) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(slug)} log={false} />;
      }
    }

    const collective = data && data.account;
    const canEditCollective = Boolean(LoggedInUser?.isAdminOfCollective(collective));
    const recurringContributions = collective && collective.orders;
    const groupedAdminOf = this.getAdministratedAccounts(LoggedInUser);
    const isAdminOfGroups = !isEmpty(groupedAdminOf);
    const mainGridColumns = isAdminOfGroups ? ['1fr', '250px 1fr'] : ['1fr'];
    return (
      <AuthenticatedPage disableSignup>
        {loadingLoggedInUser || (data?.loading && !isAdminOfGroups) ? (
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        ) : !LoggedInUser || (!data.loading && !canEditCollective) ? (
          <Container p={4}>
            <P p={2} fontSize="16px" textAlign="center">
              <FormattedMessage
                id="RecurringContributions.permissionError"
                defaultMessage="You need to be logged in as the admin of this account to view this page."
              />
            </P>
            {!LoggedInUser && <SignInOrJoinFree />}
          </Container>
        ) : (
          <Container>
            <CollectiveNavbar collective={collective} />
            <MainContainer py={[3, 4]} px={[2, 3, 4]}>
              <SectionTitle textAlign="left" mb={1}>
                <FormattedMessage id="Subscriptions.Title" defaultMessage="Recurring contributions" />
              </SectionTitle>
              <Grid gridTemplateColumns={mainGridColumns} gridGap={32} mt={4}>
                {isAdminOfGroups && (
                  <div>
                    <MenuEntry
                      href="/recurring-contributions"
                      $isActive={!slug || slug === LoggedInUser.collective.slug}
                      onClick={() => {}}
                    >
                      <Avatar collective={LoggedInUser.collective} size={32} />
                      <Span ml={3}>
                        <FormattedMessage id="ContributionFlow.PersonalProfile" defaultMessage="Personal profile" />
                      </Span>
                    </MenuEntry>
                    {Object.entries(groupedAdminOf).map(([collectiveType, members]) => (
                      <div key={collectiveType}>
                        <Flex alignItems="center" px={2} mt={3} mb={2}>
                          <Span fontWeight="bold" color="black.700" fontSize="14px">
                            {formatCollectiveType(intl, collectiveType, 2)}
                          </Span>
                          <StyledHr ml={2} width="100%" borderColor="black.300" />
                        </Flex>
                        {members.map(m => (
                          <MenuEntry
                            key={m.id}
                            href={`/${m.collective.slug}/recurring-contributions`}
                            title={m.collective.name}
                            $isActive={slug === m.collective.slug}
                          >
                            <Avatar collective={m.collective} size={32} />
                            <Span ml={3} truncateOverflow>
                              {m.collective.name}
                            </Span>
                          </MenuEntry>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                <Box>
                  <Box mx="auto">
                    <StyledFilters
                      filters={filters}
                      getLabel={key => intl.formatMessage(I18nFilters[key])}
                      selected={this.state.filter}
                      justifyContent="left"
                      minButtonWidth={175}
                      onChange={filter => this.setState({ filter: filter })}
                    />
                  </Box>
                  {data.loading ? (
                    <LoadingPlaceholder maxHeight="400px" mt={3} />
                  ) : (
                    <RecurringContributionsContainer
                      recurringContributions={recurringContributions}
                      account={collective}
                      filter={this.state.filter}
                    />
                  )}
                </Box>
              </Grid>
            </MainContainer>
          </Container>
        )}
      </AuthenticatedPage>
    );
  }
}

const addRecurringContributionsPageData = graphql(recurringContributionsQuery, {
  skip: props => !props.LoggedInUser,
  options: props => ({
    context: API_V2_CONTEXT,
    variables: {
      // If slug is passed in the URL (e.g. /facebook/recurring-contributions), use it.
      // Otherwise, use the slug of the LoggedInUser.
      slug: props.slug || props.LoggedInUser?.collective?.slug,
    },
  }),
});

export default withRouter(withUser(injectIntl(addRecurringContributionsPageData(recurringContributionsPage))));
