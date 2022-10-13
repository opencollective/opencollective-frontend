import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { themeGet } from '@styled-system/theme-get';
import { cloneDeep } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { HELP_MESSAGE } from '../../lib/constants/dismissable-help-message';
import { API_V2_CONTEXT, gqlV1 } from '../../lib/graphql/helpers';

import Container from '../Container';
import DismissibleMessage from '../DismissibleMessage';
import { Flex } from '../Grid';
import { withNewsAndUpdates } from '../NewsAndUpdatesProvider';
import StyledRoundButton from '../StyledRoundButton';
import StyledTooltip from '../StyledTooltip';

import ChangelogNotificationDropdown from './ChangelogNotificationDropdown';

const FlameIcon = styled(StyledRoundButton)`
  border-radius: 50%;
  height: ${props => props.height || '40px'};
  width: ${props => props.width || '40px'};
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
  const { height, width, backgroundSize, setShowNewsAndUpdates, setChangelogViewDate } = props;
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

  const TooltipContent = (
    <FormattedMessage id="ChangelogTrigger.tooltip.content" defaultMessage="What's new with Open Collective" />
  );

  if (!LoggedInUser) {
    return null;
  }

  return (
    <Flex>
      {hasSeenNewUpdates ? (
        <StyledTooltip content={TooltipContent}>
          <FlameIcon
            height={height}
            width={width}
            onClick={handleShowNewUpdates}
            backgroundColor="black.100"
            backgroundSize={backgroundSize}
            url="/static/images/flame-default.svg"
          />
        </StyledTooltip>
      ) : (
        <Container>
          <FlameIcon
            height={height}
            width={width}
            onClick={handleShowNewUpdates}
            backgroundColor="yellow.100"
            backgroundSize={backgroundSize}
            url="/static/images/flame-red.svg"
          />
          <DismissibleMessage messageId={HELP_MESSAGE.CHANGELOG_NOTIFICATION_DROPDOWN}>
            {({ dismiss }) => <ChangelogNotificationDropdown onClose={dismiss} />}
          </DismissibleMessage>
        </Container>
      )}
    </Flex>
  );
};

ChangelogTrigger.propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
  backgroundSize: PropTypes.string,
  setShowNewsAndUpdates: PropTypes.func,
  setChangelogViewDate: PropTypes.func,
  client: PropTypes.object.isRequired,
  showDropdown: PropTypes.bool,
};

const setChangelogViewDateMutation = gql`
  mutation SetChangelogViewDateMutation($changelogViewDate: DateTime!) {
    setChangelogViewDate(changelogViewDate: $changelogViewDate) {
      id
      hasSeenLatestChangelogEntry
    }
  }
`;

const loggedInUserQuery = gqlV1/* GraphQL */ `
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
