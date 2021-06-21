import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { parseToBoolean } from '../../lib/utils';

import Avatar from '../Avatar';
import Container from '../Container';
import { Flex } from '../Grid';
import { withNewsAndUpdates } from '../NewsAndUpdatesProvider';
import { Dropdown } from '../StyledDropdown';
import { useUser } from '../UserProvider';

import ChangelogNotificationDropdown from './ChangelogNotificationDropdown';

const CHANGE_LOG_UPDATES_ENABLED = parseToBoolean(process.env.CHANGE_LOG_UPDATES_ENABLED);

const ChangelogTrigger = props => {
  const { setShowNewsAndUpdates, setChangelogViewDate } = props;
  const [showChangelogDropdown, setShowChangelogDropdown] = useState(true);
  const { LoggedInUser, refetchLoggedInUser } = useUser();
  const hasSeenNewUpdates = LoggedInUser?.hasSeenLatestChangelogEntry;

  const handleShowNewUpdates = async () => {
    setShowNewsAndUpdates(true);
    await setChangelogViewDate({ variables: { changelogViewDate: new Date() } });
    refetchLoggedInUser();
  };

  useEffect(() => {
    if (LoggedInUser) {
      refetchLoggedInUser();
    }
  }, []);

  return (
    <React.Fragment>
      {LoggedInUser && CHANGE_LOG_UPDATES_ENABLED && (
        <Flex>
          {hasSeenNewUpdates && (
            <Avatar
              onClick={handleShowNewUpdates}
              src="/static/images/flame-default.svg"
              radius="30px"
              backgroundSize={10}
              ml={2}
            />
          )}
          {!hasSeenNewUpdates && (
            <Dropdown>
              <React.Fragment>
                <Avatar
                  onClick={handleShowNewUpdates}
                  src="/static/images/flame-red.svg"
                  radius="30px"
                  backgroundSize={10}
                  backgroundColor="yellow.100"
                  ml={2}
                />
                {showChangelogDropdown && (
                  <Container>
                    <ChangelogNotificationDropdown onClose={() => setShowChangelogDropdown(false)} />
                  </Container>
                )}
              </React.Fragment>
            </Dropdown>
          )}
        </Flex>
      )}
    </React.Fragment>
  );
};

ChangelogTrigger.propTypes = {
  setShowNewsAndUpdates: PropTypes.func,
  setChangelogViewDate: PropTypes.func,
};

const setChangelogViewDateMutation = gqlV2/* GraphQL */ `
  mutation SetChangelogViewDateMutation($changelogViewDate: DateTime!) {
    setChangelogViewDate(changelogViewDate: $changelogViewDate) {
      id
    }
  }
`;

const setChangelogViewDate = graphql(setChangelogViewDateMutation, {
  name: 'setChangelogViewDate',
  options: {
    context: API_V2_CONTEXT,
  },
});

export default withNewsAndUpdates(setChangelogViewDate(ChangelogTrigger));
