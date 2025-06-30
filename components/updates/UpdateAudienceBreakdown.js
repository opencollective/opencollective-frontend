import React from 'react';
import { pick, pickBy, sum } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import LoadingPlaceholder from '../LoadingPlaceholder';

const translatedTypes = defineMessages({
  individuals: {
    id: 'AudienceBreakdown.individuals',
    defaultMessage: '{count} {count, plural, one {individual} other {individuals}}',
  },
  organizations: {
    id: 'AudienceBreakdown.organizationAdmins',
    defaultMessage: 'The admins of {count} {count, plural, one {organization} other {organizations}}',
  },
  collectives: {
    id: 'AudienceBreakdown.collectiveAdmins',
    defaultMessage: 'The admins of {count} {count, plural, one {collective} other {collectives}}',
  },
  hosted: {
    id: 'AudienceBreakdown.hostedAdmins',
    defaultMessage: 'The admins of {count} {count, plural, one {hosted account} other {hosted accounts}}',
  },
  coreContributors: {
    id: 'AudienceBreakdown.coreContributors',
    defaultMessage: '{count} {count, plural, one {core contributor} other {core contributors}}',
  },
});

const UpdateAudienceBreakdown = ({ audienceStats, isLoading = false }) => {
  const intl = useIntl();
  if (isLoading) {
    return <LoadingPlaceholder height={50} />;
  } else if (!audienceStats) {
    return <FormattedMessage defaultMessage="There was an error while loading the audience stats." id="uIHzyf" />;
  } else if (audienceStats?.id.includes('NO_ONE')) {
    return <FormattedMessage defaultMessage="Your Update will not be sent to anyone." id="qzsw+D" />;
  }

  const typesWithStats = Object.keys(translatedTypes);
  const stats = pickBy(audienceStats, (value, key) => value && typesWithStats.includes(key));
  const hasOnlyTotal = !sum(
    Object.values(pick(audienceStats, ['collectives', 'hosted', 'individuals', 'organizations', 'coreContributors'])),
  );
  return (
    <div data-cy="update-audience-breakdown">
      <FormattedMessage
        id="UpdateAudienceBreakdown.Total"
        defaultMessage="Your Update will be sent to a total of {count} emails"
        values={{ count: audienceStats.total }}
      />
      {hasOnlyTotal ? '.' : ':'}
      {!hasOnlyTotal && (
        <ul className="list-inside list-disc">
          {Object.entries(stats).map(([key, count]) => (
            <li key={key}>{intl.formatMessage(translatedTypes[key], { count })}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpdateAudienceBreakdown;
