import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import themeGet from '@styled-system/theme-get';
import { cloneDeep } from 'lodash';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { parseToBoolean } from '../../lib/utils';

import { Flex } from '../Grid';
import { withNewsAndUpdates } from '../NewsAndUpdatesProvider';
import { Dropdown } from '../StyledDropdown';
import StyledRoundButton from '../StyledRoundButton';

import ChangelogNotificationDropdown from './ChangelogNotificationDropdown';

const CHANGE_LOG_UPDATES_ENABLED = parseToBoolean(process.env.CHANGE_LOG_UPDATES_ENABLED);

const FlameIcon = styled(StyledRoundButton)`
  border-radius: 50%;
  height: 30px;
  width: 30px;
  margin-left: 2px;

  &,
  &:active {
    background: ${props => themeGet(props.backgroundColor)};
    background-image: ${props => `url(${props.url})`};
    background-repeat: no-repeat;
    background-position: center center;
  }

  &:active {
    background-color: transparent;
  }
`;

const ChangelogTrigger = props => {
  const { setShowNewsAndUpdates, setChangelogViewDate } = props;
  const { data } = useQuery(loggedInUserQuery, { fetchPolicy: 'cache-only' });
  const LoggedInUser = data?.LoggedInUser;
  const hasSeenNewUpdates = LoggedInUser?.hasSeenLatestChangelogEntry;

  const handleShowNewUpdates = () => {
    setShowNewsAndUpdates(true);
    setChangelogViewDate({
      variables: { changelogViewDate: new Date() },
      update: store => {
        const data = cloneDeep(store.readQuery({ query: loggedInUserQuery }));
        data.LoggedInUser.hasSeenLatestChangelogEntry = true;
        store.writeQuery({ query: loggedInUserQuery, data });
      },
    });
  };

  if (!LoggedInUser || !CHANGE_LOG_UPDATES_ENABLED) {
    return null;
  }

  return (
    <Flex>
      {hasSeenNewUpdates ? (
        <FlameIcon onClick={handleShowNewUpdates} backgroundColor="black.100" url="/static/images/flame-default.svg" />
      ) : (
        <Dropdown>
          <FlameIcon onClick={handleShowNewUpdates} backgroundColor="yellow.100" url="/static/images/flame-red.svg" />
          <ChangelogNotificationDropdown />
        </Dropdown>
      )}
    </Flex>
  );
};

ChangelogTrigger.propTypes = {
  setShowNewsAndUpdates: PropTypes.func,
  setChangelogViewDate: PropTypes.func,
  client: PropTypes.object.isRequired,
  showDropdown: PropTypes.bool,
};

const setChangelogViewDateMutation = gqlV2/* GraphQL */ `
  mutation SetChangelogViewDateMutation($changelogViewDate: DateTime!) {
    setChangelogViewDate(changelogViewDate: $changelogViewDate) {
      id
      hasSeenLatestChangelogEntry
    }
  }
`;

const loggedInUserQuery = gql`
  query LoggedInUser {
    LoggedInUser {
      id
      hasSeenLatestChangelogEntry
    }
  }
`;

const setChangelogViewDate = graphql(setChangelogViewDateMutation, {
  name: 'setChangelogViewDate',
  options: {
    context: API_V2_CONTEXT,
  },
});

export default withNewsAndUpdates(setChangelogViewDate(withApollo(ChangelogTrigger)));
