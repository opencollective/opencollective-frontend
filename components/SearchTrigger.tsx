import React from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';

const SearchTrigger = ({ setShowSearchModal }) => {
  const { LoggedInUser } = useLoggedInUser();
  React.useEffect(() => {
    const handleKeydown = e => {
      if (e.key === '/' && e.target.tagName === 'BODY') {
        e.preventDefault();
        setShowSearchModal(show => !show);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const useSearchCommandMenu = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_COMMAND);
  return (
    <button
      className="relative flex h-8 w-8 shrink items-center justify-center gap-1.5 rounded-full border text-slate-500 ring-black ring-offset-2 hover:bg-slate-50 focus:outline-hidden focus-visible:ring-2 lg:w-auto lg:justify-start lg:px-2 lg:pr-4"
      onClick={() => setShowSearchModal(true)}
    >
      <Search size={16} />
      <span className={clsx('hidden text-sm whitespace-nowrap lg:block', useSearchCommandMenu && 'pr-12')}>
        {useSearchCommandMenu ? (
          <FormattedMessage
            defaultMessage="Type {slash} to search..."
            id="1LlM9Z"
            values={{ slash: <span className="rounded-sm border bg-slate-100 px-1">/</span> }}
          />
        ) : (
          <FormattedMessage
            defaultMessage="Type {slash} to search for Collectives..."
            id="/Y9m/t"
            values={{ slash: <span className="rounded-sm border bg-slate-100 px-1">/</span> }}
          />
        )}
      </span>
    </button>
  );
};

export default SearchTrigger;
