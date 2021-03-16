import React from 'react';
import PropTypes from 'prop-types';
import { pickBy } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import LoadingPlaceholder from '../LoadingPlaceholder';

const translatedTypes = defineMessages({
  individuals: {
    id: 'Account.count.individuals',
    defaultMessage: '{count, plural, one {individual} other {individuals}}',
  },
  organizations: {
    id: 'Account.count.organizations',
    defaultMessage: '{count, plural, one {organization} other {organizations}}',
  },
  collectives: {
    id: 'Account.count.collectives',
    defaultMessage: '{count, plural, one {collective} other {collectives}}',
  },
  hosted: {
    id: 'Account.count.hosted',
    defaultMessage: '{count, plural, one {hosted account} other {hosted accounts}}',
  },
});

const UpdateAudienceBreakdown = ({ audienceStats, isLoading }) => {
  const intl = useIntl();
  if (isLoading) {
    return <LoadingPlaceholder height={50} />;
  } else if (!audienceStats) {
    return null;
  }

  const typesWithStats = Object.keys(translatedTypes);
  const stats = pickBy(audienceStats, (value, key) => value && typesWithStats.includes(key));
  return (
    <div data-cy="update-audience-breakdown">
      <FormattedMessage
        id="UpdateAudienceBreakdown.Total"
        defaultMessage="Your Update will be sent to a total of {count} emails:"
        values={{ count: audienceStats.total }}
      />
      <ul>
        {Object.entries(stats).map(([key, count]) => (
          <li key={key}>
            {count} {intl.formatMessage(translatedTypes[key], { count })}
          </li>
        ))}
      </ul>
    </div>
  );
};

UpdateAudienceBreakdown.propTypes = {
  isLoading: PropTypes.bool,
  audienceStats: PropTypes.shape({
    id: PropTypes.number,
    total: PropTypes.number,
    hosted: PropTypes.number,
    individuals: PropTypes.number,
    organizations: PropTypes.number,
    collectives: PropTypes.number,
  }),
};

export default UpdateAudienceBreakdown;
