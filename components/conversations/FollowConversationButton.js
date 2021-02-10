import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { Bell } from '@styled-icons/feather/Bell';
import { BellOff } from '@styled-icons/feather/BellOff';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { Router } from '../../server/pages';

import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';
import { withUser } from '../UserProvider';

import { isUserFollowingConversationQuery } from './graphql';

const followConversationMutation = gqlV2/* GraphQL */ `
  mutation FollowConversation($id: String!, $isActive: Boolean) {
    followConversation(id: $id, isActive: $isActive)
  }
`;

const ButtonLabel = styled(Span).attrs({
  display: ['none', 'inline'],
})`
  margin: 0 8px;
`;

/**
 * A button that checks if current user is subscribed to the conversation.
 * Because it fires a request, this button should **not** be used in lists.
 */
const FollowConversationButton = ({ conversationId, onChange, isCompact, LoggedInUser, loadingLoggedInUser }) => {
  const [followConversation, { loading: submitting }] = useMutation(followConversationMutation, {
    context: API_V2_CONTEXT,
  });

  const { data, loading } = useQuery(isUserFollowingConversationQuery, {
    context: API_V2_CONTEXT,
    variables: { id: conversationId },
    skip: !LoggedInUser,
  });

  // When user is logged out
  if (!loadingLoggedInUser && !LoggedInUser) {
    return (
      <StyledTooltip
        display="block"
        content={() => (
          <FormattedMessage
            id="mustBeLoggedInWithLink"
            defaultMessage="You must be <login-link>logged in</login-link>"
            values={{
              // eslint-disable-next-line react/display-name
              'login-link': msg => (
                <Link route="signin" params={{ next: Router.asPath }}>
                  {msg}
                </Link>
              ),
            }}
          />
        )}
      >
        <StyledButton buttonStyle="secondary" minWidth={130} disabled width="100%">
          <FormattedMessage id="actions.follow" defaultMessage="Follow" />
        </StyledButton>
      </StyledTooltip>
    );
  }

  const loggedInAccount = get(data, 'loggedInAccount');
  const isFollowing = get(loggedInAccount, 'isFollowingConversation');
  return (
    <StyledButton
      width="100%"
      minWidth={130}
      buttonStyle={isFollowing ? 'standard' : 'secondary'}
      disabled={!LoggedInUser || loadingLoggedInUser || loading || submitting}
      onClick={() => {
        return followConversation({
          variables: { id: conversationId, isActive: !isFollowing },
          update: (client, { data }) => {
            const isFollowing = get(data, 'followConversation');
            const queryParams = { query: isUserFollowingConversationQuery, variables: { id: conversationId } };
            const cacheData = client.readQuery(queryParams);
            client.writeQuery({
              query: isUserFollowingConversationQuery,
              variables: { id: conversationId },
              data: {
                ...cacheData,
                loggedInAccount: { ...cacheData.loggedInAccount, isFollowingConversation: isFollowing },
              },
            });
          },
        }).then(result => onChange && onChange(result.data.followConversation, loggedInAccount));
      }}
    >
      {isFollowing ? (
        <React.Fragment>
          <BellOff size="1.2em" />
          <ButtonLabel>
            {isCompact ? (
              <FormattedMessage id="actions.unfollow" defaultMessage="Unfollow" />
            ) : (
              <FormattedMessage id="conversation.unfollow" defaultMessage="Unfollow this Conversation" />
            )}
          </ButtonLabel>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Bell size="1.2em" />
          <ButtonLabel>
            {isCompact ? (
              <FormattedMessage id="actions.follow" defaultMessage="Follow" />
            ) : (
              <FormattedMessage id="conversation.follow" defaultMessage="Follow this Conversation" />
            )}
          </ButtonLabel>
        </React.Fragment>
      )}
    </StyledButton>
  );
};

FollowConversationButton.propTypes = {
  conversationId: PropTypes.string.isRequired,
  isCompact: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
  /** @ignore from withUser */
  loadingLoggedInUser: PropTypes.bool,
};

export default withUser(FollowConversationButton);
