import React from 'react';
import { Star } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

const RepositoryEntry = ({ value }) => {
  const { type } = value.owner;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{value.full_name}</p>
          <p className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
            {type === 'User' ? (
              <FormattedMessage id="GithubRepositories.personalRepo" defaultMessage="Personal Repo" />
            ) : (
              <FormattedMessage id="GithubRepositories.organizationRepo" defaultMessage="Organization Repo" />
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
          <span>{value.stargazers_count}</span>
          <Star className="size-3.5" />
        </div>
      </div>
      {value.description && <p className="text-xs leading-5 text-muted-foreground">{value.description}</p>}
    </div>
  );
};

export default RepositoryEntry;
