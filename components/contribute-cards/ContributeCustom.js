import React from 'react';
import PropTypes from 'prop-types';

import { injectIntl, defineMessages } from 'react-intl';

import { ContributionTypes } from '../../lib/constants/contribution-types';
import Contribute from './Contribute';

import styled from 'styled-components';

const ContributeCover = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const messages = defineMessages({
  title: {
    id: 'Donation',
    defaultMessage: 'Donation',
  },
  description: {
    id: 'CollectivePage.Contribute.Custom.Description',
    defaultMessage: 'Make a custom one time or recurring contribution to support this collective.',
  },
});

const ContributeCustom = ({ intl, collective, contributors, stats, ...props }) => {
  return (
    <ContributeCover>
      {collective.settings.disableCustomContributions && (
        <Contribute
          route="orderCollectiveNew"
          routeParams={{ collectiveSlug: collective.slug, verb: 'donate' }}
          contributeRoute={`/${collective.slug}/donate`}
          type={ContributionTypes.FINANCIAL_CUSTOM}
          title={intl.formatMessage(messages.title)}
          contributors={contributors}
          stats={stats}
          {...props}
        >
          {intl.formatMessage(messages.description)}
        </Contribute>
      )}
    </ContributeCover>
  );
};

ContributeCustom.propTypes = {
  intl: PropTypes.object,
  stats: PropTypes.object,
  contributors: PropTypes.arrayOf(PropTypes.object),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    settings: PropTypes.object,
  }).isRequired,
};

export default injectIntl(ContributeCustom);
