import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box } from '../../Grid';
import I18nFormatters from '../../I18nFormatters';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import { recurringContributionsQuery } from '../../recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../../recurring-contributions/RecurringContributionsContainer';
import StyledFilters from '../../StyledFilters';
import TemporaryNotification from '../../TemporaryNotification';
import { P } from '../../Text';
import { Dimensions } from '../_constants';
import ContainerSectionContent from '../ContainerSectionContent';
import SectionTitle from '../SectionTitle';

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

class SectionRecurringContributions extends React.Component {
  static getInitialProps({ query: { slug } }) {
    return { slug };
  }

  static propTypes = {
    slug: PropTypes.string.isRequired,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object,
    }),
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { filter: 'ACTIVE', notification: false, notificationType: null, notificationText: null };
  }

  createNotification = (type, error) => {
    this.setState({ notification: true });
    if (type === 'error') {
      this.setState({ notificationType: 'error' });
      this.setState({ notificationText: error });
    } else {
      this.setState({ notificationType: type });
    }
    window.scrollTo(0, 0);
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
    const { data, intl } = this.props;
    const { notification, notificationType, notificationText } = this.state;

    const filters = ['ACTIVE', 'MONTHLY', 'YEARLY', 'CANCELLED'];

    if (data.loading) {
      return <LoadingPlaceholder height={600} borderRadius={0} />;
    } else if (!data.account) {
      return (
        <Container display="flex" border="1px dashed #d1d1d1" justifyContent="center" py={[6, 7]} background="#f8f8f8">
          <MessageBox type="error" withIcon>
            <FormattedMessage
              id="NCP.SectionFetchError"
              defaultMessage="We encountered an error while retrieving the data for this section."
            />
          </MessageBox>
        </Container>
      );
    }

    const collective = data && data.account;
    const recurringContributions = collective && collective.orders;

    return (
      <Box pb={4}>
        {notification && (
          <TemporaryNotification
            onDismiss={this.dismissNotification}
            type={notificationType === 'error' ? 'error' : 'default'}
          >
            {notificationType === 'activate' && (
              <FormattedMessage
                id="subscription.createSuccessActivate"
                defaultMessage="Recurring contribution <strong>activated</strong>! Woohoo! 🎉"
                values={I18nFormatters}
              />
            )}
            {notificationType === 'cancel' && (
              <FormattedMessage
                id="subscription.createSuccessCancel"
                defaultMessage="Your recurring contribution has been <strong>cancelled</strong>."
                values={I18nFormatters}
              />
            )}
            {notificationType === 'update' && (
              <FormattedMessage
                id="subscription.createSuccessUpdated"
                defaultMessage="Your recurring contribution has been <strong>updated</strong>."
                values={I18nFormatters}
              />
            )}
            {notificationType === 'error' && <P>{notificationText}</P>}
          </TemporaryNotification>
        )}
        <ContainerSectionContent>
          <SectionTitle textAlign="left" mb={1}>
            <FormattedMessage
              id="CollectivePage.SectionRecurringContributions.Title"
              defaultMessage="Recurring Contributions"
            />
          </SectionTitle>
        </ContainerSectionContent>
        <Box mt={4} mx="auto" maxWidth={Dimensions.MAX_SECTION_WIDTH}>
          <StyledFilters
            filters={filters}
            getLabel={key => intl.formatMessage(I18nFilters[key])}
            selected={this.state.filter}
            justifyContent="left"
            minButtonWidth={175}
            px={Dimensions.PADDING_X}
            onChange={filter => this.setState({ filter: filter })}
          />
        </Box>
        <Container maxWidth={Dimensions.MAX_SECTION_WIDTH} px={Dimensions.PADDING_X} mt={4} mx="auto">
          <RecurringContributionsContainer
            recurringContributions={recurringContributions}
            account={collective}
            filter={this.state.filter}
            createNotification={this.createNotification}
          />
        </Container>
      </Box>
    );
  }
}

const getData = graphql(recurringContributionsQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: getRecurringContributionsSectionQueryVariables(props.slug),
  }),
});

export const getRecurringContributionsSectionQueryVariables = slug => {
  return { slug };
};

export default injectIntl(getData(SectionRecurringContributions));
