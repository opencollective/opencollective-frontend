import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';
import dynamic from 'next/dynamic';

import CreateNew from './CreateNew';
import ContributeEvent from './ContributeEvent';
import ContributeCollective from './ContributeCollective';
import { CONTRIBUTE_CARD_WIDTH } from './Contribute';
import LoadingPlaceholder from '../LoadingPlaceholder';

const ContributeEventPanel = ({
  isAdmin,
  collective,
  joinedEvents,
  handleSettingsUpdate,
  CONTRIBUTE_CARD_PADDING_X,
  hasNoContributorForEvents,
}) => {
  const StyledDragDropPlaceHolder = () => <LoadingPlaceholder width={CONTRIBUTE_CARD_WIDTH} />;
  const dynamicOptions = { loading: StyledDragDropPlaceHolder, ssr: false };
  const StyledDragDrop = dynamic(
    () => import(/* webpackChunkName: 'StyledDragDrop' */ '../StyledDragDrop'),
    dynamicOptions,
  );

  if (!isAdmin) {
    return (
      <Fragment>
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
  } else
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
  isAdmin: PropTypes.bool.isRequired,
  collective: PropTypes.object.isRequired,
  joinedEvents: PropTypes.array.isRequired,
  handleSettingsUpdate: PropTypes.func.isRequired,
  CONTRIBUTE_CARD_PADDING_X: PropTypes.array.isRequired,
  hasNoContributorForEvents: PropTypes.bool.isRequired,
};

export default ContributeEventPanel;
