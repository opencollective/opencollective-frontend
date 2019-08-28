import React from 'react';
import PropTypes from 'prop-types';

import { injectIntl, defineMessages } from 'react-intl';

import { ContributionTypes } from '../_constants';
import Contribute from './Contribute';

const messages = defineMessages({
  title: {
    id: 'CollectivePage.Contribute.Custom',
    defaultMessage: 'Donation',
  },
  description: {
    id: 'CollectivePage.Contribute.Custom.Description',
    defaultMessage: 'Make a custom one time or recurring contribution to support this collective.',
  },
});

const ContributeCustom = ({ intl, collective, contributors, stats }) => {
  return (
    <Contribute
      route="orderCollectiveNew"
      routeParams={{ collectiveSlug: collective.slug, verb: 'donate' }}
      contributeRoute={`/${collective.slug}/donate`}
      type={ContributionTypes.FINANCIAL_CUSTOM}
      title={intl.formatMessage(messages.title)}
      contributors={contributors}
      stats={stats}
    >
      {intl.formatMessage(messages.description)}
    </Contribute>
  );
};

ContributeCustom.propTypes = {
  intl: PropTypes.object,
  stats: PropTypes.object,
  contributors: PropTypes.arrayOf(PropTypes.object),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default injectIntl(ContributeCustom);
