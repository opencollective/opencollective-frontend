import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';

import AuthenticatedPage from '../components/AuthenticatedPage';
import CollectiveNavbar from '../components/collective-navbar';
import { Dimensions } from '../components/collective-page/_constants';
import SectionTitle from '../components/collective-page/SectionTitle';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Box } from '../components/Grid';
import Loading from '../components/Loading';
import { recurringContributionsQuery } from '../components/recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../components/recurring-contributions/RecurringContributionsContainer';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import StyledFilters from '../components/StyledFilters';
import { P } from '../components/Text';
import { withUser } from '../components/UserProvider';

const MainContainer = styled(Container)`
  max-width: ${Dimensions.MAX_SECTION_WIDTH}px;
  margin: 0 auto;
`;

const FILTERS = {
  ACTIVE: 'ACTIVE',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  CANCELLED: 'CANCELLED',
};
const I18nFilters = defineMessages({
  [FILTERS.ACTIVE]: {
    id: 'Subscriptions.Active',
    defaultMessage: 'Active',
  },
  [FILTERS.WEEKLY]: {
    id: 'Frequency.Weekly',
    defaultMessage: 'Weekly',
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

class recurringContributionsPage extends React.Component {
  static getInitialProps({ query: { slug } }) {
    return { slug };
  }

  static propTypes = {
    slug: PropTypes.string.isRequired,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object,
    }), // from withData
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { filter: 'ACTIVE' };
  }

  render() {
    const { slug, data, intl, loadingLoggedInUser, LoggedInUser } = this.props;

    const filters = ['ACTIVE', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CANCELLED'];

    if (!data?.loading && !loadingLoggedInUser && LoggedInUser) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(slug)} log={false} />;
      }
    }

    const collective = data && data.account;
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const recurringContributions = collective && collective.orders;
    return (
      <AuthenticatedPage>
        {data?.loading || loadingLoggedInUser ? (
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        ) : (
          <Fragment>
            {!canEditCollective && (
              <Container p={4}>
                <P p={2} fontSize="16px" textAlign="center">
                  <FormattedMessage
                    id="RecurringContributions.permissionError"
                    defaultMessage="You need to be logged in as the admin of this account to view this page."
                  />
                </P>
                <SignInOrJoinFree />
              </Container>
            )}
            {canEditCollective && (
              <Container>
                <CollectiveNavbar collective={collective} />
                <MainContainer py={[3, 4]} px={[2, 3, 4]}>
                  <SectionTitle textAlign="left" mb={1}>
                    <FormattedMessage id="Subscriptions.Title" defaultMessage="Recurring contributions" />
                  </SectionTitle>
                  <Box mt={4} mx="auto">
                    <StyledFilters
                      filters={filters}
                      getLabel={key => intl.formatMessage(I18nFilters[key])}
                      selected={this.state.filter}
                      justifyContent="left"
                      minButtonWidth={175}
                      onChange={filter => this.setState({ filter: filter })}
                    />
                  </Box>
                  <RecurringContributionsContainer
                    recurringContributions={recurringContributions}
                    account={collective}
                    filter={this.state.filter}
                  />
                </MainContainer>
              </Container>
            )}
          </Fragment>
        )}
      </AuthenticatedPage>
    );
  }
}

const addRecurringContributionsPageData = graphql(recurringContributionsQuery, {
  skip: props => !props.LoggedInUser,
  options: {
    context: API_V2_CONTEXT,
  },
});

export default withUser(injectIntl(addRecurringContributionsPageData(recurringContributionsPage)));
