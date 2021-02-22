import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import { ContributionTypes } from '../../lib/constants/contribution-types';

import Contribute from './Contribute';

const messages = defineMessages({
  title: {
    id: 'Donation',
    defaultMessage: 'Donation',
  },
  description: {
    id: 'CollectivePage.Contribute.Custom.Description',
    defaultMessage: 'Make a custom one-time or recurring contribution.',
  },
});

const ContributeCustom = ({ intl, collective, contributors, stats, ...props }) => {
  return (
    <Contribute
      route={`/${collective.slug}/donate`}
      type={ContributionTypes.FINANCIAL_CUSTOM}
      title={intl.formatMessage(messages.title)}
      contributors={contributors}
      stats={stats}
      {...props}
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
