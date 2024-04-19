import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';

import Container from '../../Container';
import { P } from '../../Text';
import SettingsSectionTitle from '../sections/SettingsSectionTitle';
import SendFundsToCollectiveSection from '../SendFundsToCollectiveSection';

const EmptyBalance = ({ collective, LoggedInUser }) => {
  if (!collective.host || collective.host.id === collective.id) {
    return null;
  }

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start" mb={50}>
      <SettingsSectionTitle>
        <FormattedMessage
          id="collective.balance.title"
          defaultMessage="Empty {type, select, EVENT {Event} PROJECT {Project} FUND {Fund} COLLECTIVE {Collective} other {account}} balance"
          values={{ type: collective.type }}
        />
      </SettingsSectionTitle>
      <P mb={2} lineHeight="16px" fontSize="14px">
        <FormattedMessage
          id="collective.balance.description"
          defaultMessage="Transfer remaining balance to {type, select, PROJECT {the Collective} EVENT {the Collective} other {the Fiscal Host}}. {type, select, EVENT {Event} PROJECT {Project} FUND {Fund} COLLECTIVE {Collective} other {account}} balance must be zero to archive {type, select, EVENT {the Event} PROJECT {the Project} other {or change Hosts}}. {type, select, EVENT {} PROJECT {} other {Alternatively, you can submit an expense or donate to another Collective to zero the balance.}}"
          values={{ type: collective.type }}
        />
      </P>
      {[CollectiveType.FUND, CollectiveType.COLLECTIVE].includes(collective.type) &&
        !collective.host.hostCollective && (
          <P color="rgb(224, 183, 0)" my={2}>
            <FormattedMessage
              id="collective.balance.notAvailable"
              defaultMessage="The Host doesn't support this feature. Submit an expense, donate to another Collective, or contact support if you're blocked."
            />
          </P>
        )}
      {[CollectiveType.FUND, CollectiveType.COLLECTIVE].includes(collective.type) && collective.host.hostCollective && (
        <SendFundsToCollectiveSection
          LoggedInUser={LoggedInUser}
          collective={collective}
          toCollective={collective.host.hostCollective}
        />
      )}
      {[CollectiveType.PROJECT, CollectiveType.EVENT].includes(collective.type) && collective.parentCollective && (
        <SendFundsToCollectiveSection
          LoggedInUser={LoggedInUser}
          collective={collective}
          toCollective={collective.parentCollective}
        />
      )}
    </Container>
  );
};

EmptyBalance.propTypes = {
  collective: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
};

export default EmptyBalance;
