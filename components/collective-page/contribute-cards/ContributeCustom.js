import React from 'react';
import PropTypes from 'prop-types';

import { injectIntl, defineMessages } from 'react-intl';

import { ContributionTypes } from '../_constants';
import Contribute from './Contribute';

const messages = defineMessages({
  title: {
    id: 'CollectivePage.Contribute.Custom',
    defaultMessage: 'Custom contribution',
  },
  description: {
    id: 'CollectivePage.Contribute.Custom.Description',
    defaultMessage: 'Nothing there for you? Make a custom one time or recurring contribution.',
  },
});

const ContributeCustom = ({ intl, collective }) => {
  return (
    <Contribute
      route="orderCollectiveNew"
      routeParams={{ collectiveSlug: collective.slug, verb: 'donate' }}
      contributeRoute={`/${collective.slug}/donate`}
      type={ContributionTypes.FINANCIAL_CUSTOM}
      title={intl.formatMessage(messages.title)}
    >
      {intl.formatMessage(messages.description)}
    </Contribute>
  );
};

ContributeCustom.propTypes = {
  intl: PropTypes.object,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }).isRequired,
};

export default injectIntl(ContributeCustom);
