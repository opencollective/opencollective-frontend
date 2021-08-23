import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import { ContributionTypes } from '../../lib/constants/contribution-types';

import Contribute from './Contribute';

const messages = defineMessages({
  title: {
    id: 'CollectivePage.Contribute.Crypto.title',
    defaultMessage: 'Crypto Contribution',
  },
  description: {
    id: 'CollectivePage.Contribute.Crypto.Description',
    defaultMessage: 'Make a crypto contribution.',
  },
});

const ContributeCrypto = ({ intl, collective, contributors, stats, ...props }) => {
  return (
    <Contribute
      route={`/${collective.slug}/donate/crypto`}
      type={ContributionTypes.FINANCIAL_CRYPTO}
      title={intl.formatMessage(messages.title)}
      contributors={contributors}
      stats={stats}
      {...props}
    >
      {intl.formatMessage(messages.description)}
    </Contribute>
  );
};

ContributeCrypto.propTypes = {
  intl: PropTypes.object,
  stats: PropTypes.object,
  contributors: PropTypes.arrayOf(PropTypes.object),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default injectIntl(ContributeCrypto);
