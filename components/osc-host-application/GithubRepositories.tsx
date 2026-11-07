import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { escapeInput } from '../../lib/utils';

import { Input } from '../ui/Input';

import GithubRepositoryEntry from './GithubRepositoryEntry';

const messages = defineMessages({
  filterByName: { id: 'Filter.ByName', defaultMessage: 'Filter by name' },
});

/**
 * Component for displaying list of public repositories
 */
const GithubRepositories = ({ repositories, setGithubInfo }) => {
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState('');
  const [selectedFullName, setSelectedFullName] = useState(null);

  const filteredRepositories = search
    ? repositories.filter(repository => repository.name.match(new RegExp(escapeInput(search), 'i')))
    : repositories;

  const selectRepository = repository => {
    setSelectedFullName(repository.full_name);
    setGithubInfo({
      handle: `${repository.owner.login}/${repository.name}`,
      licenseSpdxId: repository.license?.spdx_id,
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          type="text"
          className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          placeholder={formatMessage(messages.filterByName)}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filteredRepositories.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          <FormattedMessage id="GithubRepositories.noMatch" defaultMessage="No repository match" />
        </p>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          {filteredRepositories.map(repository => (
            <label
              key={repository.full_name}
              className="flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-accent has-checked:bg-accent"
            >
              <input
                type="radio"
                name="repository"
                value={repository.full_name}
                checked={selectedFullName === repository.full_name}
                onChange={() => selectRepository(repository)}
                data-cy="radio-select"
                className="mt-1 accent-primary"
              />
              <GithubRepositoryEntry value={repository} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default GithubRepositories;
