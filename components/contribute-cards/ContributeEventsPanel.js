import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Box } from '@rebass/grid';
import dynamic from 'next/dynamic';

import { Pencil } from 'styled-icons/boxicons-solid/Pencil';
import { Move } from 'styled-icons/boxicons-regular/Move';
import { Close } from 'styled-icons/material/Close';
import styled from 'styled-components';
import memoizeOne from 'memoize-one';

import CreateNew from './CreateNew';
import ContributeEvent from './ContributeEvent';
import ContributeCollective from './ContributeCollective';
import { CONTRIBUTE_CARD_WIDTH } from './Contribute';
import LoadingPlaceholder from '../LoadingPlaceholder';
import colors from '../../lib/constants/colors';

const Handle = styled.div`
  background-color: ${({ bgColor }) => bgColor || colors.white};
  box-shadow: 1px 1px 1px ${colors.darkgray};
  opacity: ${({ hide }) => (hide ? 0 : 1)};
  transition: all 0.3s ease-out;
  justify-content: center;
  color: ${colors.white};
  align-items: center;
  margin-bottom: 5px;
  border-radius: 50%;
  outline: none;
  display: flex;
  height: 30px;
  width: 30px;
  > * {
    color: ${({ color }) => color || colors.darkgray};
  }
`;

const ContributeEventsPanel = ({
  isAdmin,
  collective,
  joinedEvents,
  handleSettingsUpdate,
  CONTRIBUTE_CARD_PADDING_X,
  hasNoContributorForEvents,
}) => {
  const CONTRIBUTE_CARD_HEIGHT = 341;

  const StyledDragDropPlaceHolder = () => (
    <LoadingPlaceholder width={CONTRIBUTE_CARD_WIDTH} heigth={CONTRIBUTE_CARD_HEIGHT} />
  );
  const dynamicOptions = { loading: StyledDragDropPlaceHolder, ssr: true };
  const StyledDragDrop = dynamic(
    () => import(/* webpackChunkName: 'StyledDragDrop' */ '../StyledDragDrop'),
    dynamicOptions,
  );

  const getOtherWaysToContributeOrder = memoizeOne(({ collective }) => {
    const { settings = {} } = collective;
    const { collectivePage = {} } = settings;
    const { otherWaysToContributeOrder } = collectivePage;

    if (!otherWaysToContributeOrder) return [];
    if (!otherWaysToContributeOrder[0]) return [];
    return otherWaysToContributeOrder.filter(i => i !== 'custom');
  });

  const handleShuffle = otherWaysToContributeOrder => {
    const { settings = {} } = collective;
    const { collectivePage = {} } = settings;

    handleSettingsUpdate({
      ...settings,
      collectivePage: {
        ...collectivePage,
        otherWaysToContributeOrder,
      },
    });
  };

  const identifier = memoizeOne(item => {
    if (!item) return;
    if (typeof item.id === 'string') {
      if (item.id.toLowerCase().includes('event')) return item.id;
      if (item.id.toLowerCase().includes('collective')) return item.id;
      throw Error("Error in identifier function: item.id <event.id || childCollective.id> doesn't event or collective");
    }
    return item.__typename.toLowerCase().includes('event') ? `event-${item.id}` : `collective-${item.id}`;
  });

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
        <Box px={CONTRIBUTE_CARD_PADDING_X} minHeight={150}>
          <CreateNew route={`/${collective.slug}/events/create`} data-cy="create-event">
            <FormattedMessage id="event.create.btn" defaultMessage="Create Event" />
          </CreateNew>
        </Box>
        <StyledDragDrop
          handle={true}
          id={collective.id}
          items={joinedEvents}
          direction="horizontal"
          onShuffle={handleShuffle}
          identifier={identifier}
          itemsOrder={getOtherWaysToContributeOrder({ collective })}
        >
          {({ item, cssHelper, handleProps: { wrapper, dragProps, hideDuringDrag } }) => (
            <Fragment>
              {wrapper(
                <Handle key={'move'} bgColor={colors.black} color={colors.white} {...dragProps}>
                  <Move size={15} />
                </Handle>,
                <Handle key={'pencil'} hide={hideDuringDrag}>
                  <Pencil size={15} />
                </Handle>,
                <Handle key={'close'} hide={hideDuringDrag}>
                  <Close size={15} />
                </Handle>,
              )}
              {item.__typename.toLowerCase().includes('event') ? (
                <Box key={item.id} px={CONTRIBUTE_CARD_PADDING_X}>
                  <ContributeEvent
                    css={cssHelper}
                    collective={collective}
                    event={item}
                    hideContributors={hasNoContributorForEvents}
                  />
                </Box>
              ) : (
                <Box key={item.id} px={CONTRIBUTE_CARD_PADDING_X}>
                  <ContributeCollective css={cssHelper} collective={item} />
                </Box>
              )}
            </Fragment>
          )}
        </StyledDragDrop>
      </Fragment>
    );
};

ContributeEventsPanel.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  collective: PropTypes.object.isRequired,
  joinedEvents: PropTypes.array.isRequired,
  handleSettingsUpdate: PropTypes.func.isRequired,
  CONTRIBUTE_CARD_PADDING_X: PropTypes.array.isRequired,
  hasNoContributorForEvents: PropTypes.bool.isRequired,
};

export default React.memo(ContributeEventsPanel);
