import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';

import { ContributionTypes } from '../../lib/constants/contribution-types';
import { getCollectivePageRoute } from '../../lib/url-helpers';

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
      route={`${getCollectivePageRoute(collective)}/donate`}
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

export default injectIntl(ContributeCustom);
