import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import themeGet from '@styled-system/theme-get';
import { cloneDeep } from 'lodash';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { parseToBoolean } from '../../lib/utils';

import Container from '../Container';
import { Flex } from '../Grid';
import { withNewsAndUpdates } from '../NewsAndUpdatesProvider';
import { Dropdown } from '../StyledDropdown';
import { Span } from '../Text';
import { useUser } from '../UserProvider';

import ChangelogNotificationDropdown from './ChangelogNotificationDropdown';

const CHANGE_LOG_UPDATES_ENABLED = parseToBoolean(process.env.CHANGE_LOG_UPDATES_ENABLED);

const FlameIcon = styled(Flex)`
  border-radius: 50%;
  background-color: ${props => themeGet(props.backgroundColor)};
  background-image: ${props => `url(${props.url})`};
  background-repeat: no-repeat;
  background-position: center center;
  height: 30px;
  width: 30px;
  margin-left: 2px;
`;

const ChangelogTrigger = props => {
  const { setShowNewsAndUpdates, setChangelogViewDate } = props;
  const [showChangelogDropdown, setShowChangelogDropdown] = useState(true);
  const { LoggedInUser } = useUser();
  const LoggedInUserFromCache = props.client.readQuery({ query: loggedInUserQuery })?.LoggedInUser || LoggedInUser;
  const hasSeenNewUpdates = LoggedInUserFromCache?.hasSeenLatestChangelogEntry;

  const handleShowNewUpdates = async () => {
    setShowNewsAndUpdates(true);
    await setChangelogViewDate({ variables: { changelogViewDate: new Date() } });
    const data = cloneDeep(props.client.readQuery({ query: loggedInUserQuery }));
    data.LoggedInUser.hasSeenLatestChangelogEntry = true;
    await props.client.writeQuery({ query: loggedInUserQuery, data });
  };

  if (!LoggedInUserFromCache || !CHANGE_LOG_UPDATES_ENABLED) {
    return null;
  }

  return (
    <Flex onClick={handleShowNewUpdates}>
      {hasSeenNewUpdates ? (
        <FlameIcon backgroundColor="black.100" url="/static/images/flame-default.svg" />
      ) : (
        <Dropdown>
          <Span>
            <FlameIcon backgroundColor="yellow.100" url="/static/images/flame-red.svg" />
            {showChangelogDropdown && props.showDropdown && (
              <Container>
                <ChangelogNotificationDropdown onClose={() => setShowChangelogDropdown(false)} />
              </Container>
            )}
          </Span>
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
