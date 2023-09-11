import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { cloneDeep } from 'lodash';
import { Megaphone } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV1 } from '../../lib/graphql/helpers';

import { WebsiteName } from '../I18nFormatters';
import { withNewsAndUpdates } from '../NewsAndUpdatesProvider';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

const ChangelogTrigger = ({ setShowNewsAndUpdates, setChangelogViewDate }) => {
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

  if (!LoggedInUser) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="relative flex h-8 w-8 items-center justify-center  rounded-full border text-slate-500 ring-black ring-offset-2 hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
        onClick={handleShowNewUpdates}
      >
        <Megaphone size={18} />
        {!hasSeenNewUpdates && <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary" />}
      </TooltipTrigger>
      <TooltipContent>
        <FormattedMessage
          id="ChangelogTrigger.tooltip.content"
          defaultMessage="What's new with {WebsiteName}"
          values={{ WebsiteName }}
        />
      </TooltipContent>
    </Tooltip>
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
