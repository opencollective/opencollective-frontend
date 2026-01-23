import React from 'react';
import { clsx } from 'clsx';
import { Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';

import { Button } from './ui/Button';

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
  }, [setShowSearchModal]);

  const useSearchCommandMenu = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_COMMAND);
  return (
    <Button
      variant="outline"
      className={clsx(
        'relative flex h-8 w-8 shrink items-center justify-center gap-1.5 px-0 py-0 lg:justify-start lg:px-2 lg:py-2 lg:pr-4',
        LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.SEARCH_COMMAND)
          ? 'max-w-lg flex-1 border lg:w-full'
          : 'rounded-full border lg:w-auto',
      )}
      onClick={() => setShowSearchModal(true)}
    >
      <Search size={16} />
      <span className={clsx('hidden text-sm whitespace-nowrap lg:block', useSearchCommandMenu && 'pr-12')}>
        {useSearchCommandMenu ? (
          <FormattedMessage
            defaultMessage="Type {slash} to search..."
            id="1LlM9Z"
            values={{
              slash: (
                <span className="rounded-sm border bg-slate-100 px-1" key="slash">
                  /
                </span>
              ),
            }}
          />
        ) : (
          <FormattedMessage
            defaultMessage="Type {slash} to search for Collectives..."
            id="/Y9m/t"
            values={{
              slash: (
                <span className="rounded-sm border bg-slate-100 px-1" key="slash">
                  /
                </span>
              ),
            }}
          />
        )}
      </span>
    </Button>
  );
};

export default SearchTrigger;
