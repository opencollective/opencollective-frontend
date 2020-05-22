import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import AuthenticatedPage from '../components/AuthenticatedPage';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { Flex } from '../components/Grid';
import I18nFormatters from '../components/I18nFormatters';
import Loading from '../components/Loading';
import RecurringContributionsContainer from '../components/recurring-contributions/RecurringContributionsContainer';
import StyledTag from '../components/StyledTag';
import TemporaryNotification from '../components/TemporaryNotification';
import { H2, P } from '../components/Text';
import { withUser } from '../components/UserProvider';

const recurringContributionsPageQuery = gqlV2/* GraphQL */ `
  query RecurringContributions($collectiveSlug: String) {
    account(slug: $collectiveSlug) {
      id
      slug
      name
      type
      description
      settings
      imageUrl
      twitterHandle
      orders {
        totalCount
        nodes {
          id
          amount {
            value
            currency
          }
          status
          frequency
          tier {
            name
          }
          totalDonations {
            value
            currency
          }
          toAccount {
            id
            slug
            name
            description
            tags
            imageUrl
            settings
          }
        }
      }
    }
  }
`;

const FilterTag = styled(StyledTag)`
  display: flex;
  align-items: center;
  width: fit-content;
  cursor: pointer;
  min-width: 180px;
`;

class recurringContributionsPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug } }) {
    return { collectiveSlug };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object.isRequired,
    }), // from withData
  };

  constructor(props) {
    super(props);
    this.state = { filter: 'active', notification: false, notificationType: null, notificationText: null };
  }

  createNotification = (type, error) => {
    this.setState({ notification: true });
    if (type === 'activate') {
      this.setState({ notificationType: 'activate' });
    } else if (type === 'cancel') {
      this.setState({ notificationType: 'cancel' });
    } else if (type === 'error') {
      this.setState({ notificationType: 'error' });
      this.setState({ notificationText: error });
    }
  };

  dismissNotification = () => {
    this.setState(state => ({
      ...state.filter,
      notification: false,
      notificationType: null,
      notificationText: null,
    }));
  };

  render() {
    const { collectiveSlug, data, LoggedInUser } = this.props;
    const { notification, notificationType, notificationText } = this.state;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug, true)} log={false} />;
      }
    }

    const collective = data && data.account;
    const recurringContributions = collective && collective.orders;

    return (
      <AuthenticatedPage>
        {data.loading || !LoggedInUser ? (
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        ) : (
          <Fragment>
            {notification && (
              <TemporaryNotification
                onDismiss={this.dismissNotification}
                type={notificationType === 'error' ? 'error' : 'default'}
              >
                {notificationType === 'activate' && (
                  <FormattedMessage
                    id="subscription.createSuccessActivate"
                    defaultMessage="<strong>Recurring contribution activated!</strong> Woohoo! 🎉"
                    values={I18nFormatters}
                  />
                )}
                {notificationType === 'cancel' && (
                  <FormattedMessage
                    id="subscription.createSuccessCancel"
                    defaultMessage="<strong>Your recurring contribution has been cancelled.</strong>"
                    values={I18nFormatters}
                  />
                )}
                {notificationType === 'error' && <P>{notificationText}</P>}
              </TemporaryNotification>
            )}
            <Container py={[5, 6]} px={[3, 4]}>
              <H2 my={2} fontWeight="300">
                <FormattedMessage
                  id="Subscriptions.Title"
                  defaultMessage="{collectiveName}'s recurring financial contributions"
                  values={{
                    collectiveName: collective.name,
                  }}
                />
              </H2>
              <Flex my={3} flexWrap="wrap">
                <FilterTag
                  type={this.state.filter === 'active' ? 'dark' : null}
                  variant="rounded"
                  minWidth="180px"
                  mx={2}
                  onClick={() => this.setState({ filter: 'active' })}
                >
                  <FormattedMessage id="Subscriptions.Active" defaultMessage="Active recurring contributions" />
                </FilterTag>
                <FilterTag
                  type={this.state.filter === 'monthly' ? 'dark' : null}
                  variant="rounded"
                  minWidth="180px"
                  mx={2}
                  onClick={() => this.setState({ filter: 'monthly' })}
                >
                  <FormattedMessage id="Subscriptions.Monthly" defaultMessage="Monthly recurring contributions" />
                </FilterTag>
                <FilterTag
                  type={this.state.filter === 'yearly' ? 'dark' : null}
                  variant="rounded"
                  minWidth="180px"
                  mx={2}
                  onClick={() => this.setState({ filter: 'yearly' })}
                >
                  <FormattedMessage id="Subscriptions.Yearly" defaultMessage="Yearly recurring contributions" />
                </FilterTag>
                <FilterTag
                  type={this.state.filter === 'cancelled' ? 'dark' : null}
                  variant="rounded"
                  mx={2}
                  onClick={() => this.setState({ filter: 'cancelled' })}
                >
                  <FormattedMessage id="Subscriptions.Cancelled" defaultMessage="Cancelled recurring contributions" />
                </FilterTag>
              </Flex>
              <RecurringContributionsContainer
                recurringContributions={recurringContributions}
                filter={this.state.filter}
                createNotification={this.createNotification}
              />
            </Container>
          </Fragment>
        )}
      </AuthenticatedPage>
    );
  }
}

const getData = graphql(recurringContributionsPageQuery, {
  options: {
    context: API_V2_CONTEXT,
  },
});

export default injectIntl(withUser(getData(recurringContributionsPage)));
