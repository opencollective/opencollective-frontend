import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';

import CreateNew from './CreateNew';
import ContributeEvent from './ContributeEvent';
import ContributeCollective from './ContributeCollective';

const ContributeEventPanel = ({
  isAdmin,
  collective,
  joinedEvents,
  handleSettingsUpdate,
  CONTRIBUTE_CARD_PADDING_X,
  hasNoContributorForEvents,
}) => {
  return (
    <Fragment>
      {isAdmin && (
        <Box px={CONTRIBUTE_CARD_PADDING_X} minHeight={150}>
          <CreateNew route={`/${collective.slug}/events/create`} data-cy="create-event">
            <FormattedMessage id="event.create.btn" defaultMessage="Create Event" />
          </CreateNew>
        </Box>
      )}
      {joinedEvents.map(item =>
        item.__typename.toLowerCase().includes('event') ? (
          <Box key={item.id} px={CONTRIBUTE_CARD_PADDING_X}>
            <ContributeEvent collective={collective} event={item} hideContributors={hasNoContributorForEvents} />
          </Box>
        ) : (
          <Box key={item.id} px={CONTRIBUTE_CARD_PADDING_X}>
            <ContributeCollective collective={item} />
          </Box>
        ),
      )}
    </Fragment>
  );
};

ContributeEventPanel.propTypes = {
  props: PropTypes.Object,
};

export default ContributeEventPanel;
