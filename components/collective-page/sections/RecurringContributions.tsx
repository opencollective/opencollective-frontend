import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import { manageContributionsQuery } from '../../recurring-contributions/graphql/queries';
import RecurringContributionsContainer from '../../recurring-contributions/RecurringContributionsContainer';
import StyledFilters from '../../StyledFilters';
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
    defaultMessage: 'Canceled',
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
    this.state = { filter: 'ACTIVE' };
  }

  render() {
    const { data, intl } = this.props;

    const filters = ['ACTIVE', 'MONTHLY', 'YEARLY', 'CANCELLED'];

    if (data?.loading) {
      return <LoadingPlaceholder height={600} borderRadius={0} />;
    } else if (!data?.account) {
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

    const collective = data.account;
    const recurringContributions = collective && collective.orders;
    return (
      <Box pb={4}>
        <ContainerSectionContent>
          <SectionTitle textAlign="left" mb={4} fontSize={['20px', '24px', '32px']} color="black.700">
            <FormattedMessage id="Contributions.Recurring" defaultMessage="Recurring Contributions" />
          </SectionTitle>
        </ContainerSectionContent>
        <Box mx="auto" maxWidth={Dimensions.MAX_SECTION_WIDTH}>
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
            mt={3}
          />
        </Container>
      </Box>
    );
  }
}

const getData = graphql(manageContributionsQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: getRecurringContributionsSectionQueryVariables(props.slug),
  }),
});

export const getRecurringContributionsSectionQueryVariables = slug => {
  return { slug };
};

export default injectIntl(getData(SectionRecurringContributions));
