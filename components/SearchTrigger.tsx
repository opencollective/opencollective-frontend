import React from 'react';
import { Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

const SearchTrigger = () => {
  return (
    <button className="relative flex h-10 w-10 shrink items-center justify-center gap-2 rounded-md text-left font-medium text-muted-foreground ring-black ring-offset-2 hover:bg-muted focus:outline-none focus-visible:ring-2 lg:w-[512px] lg:justify-start lg:px-2.5 lg:pr-4">
      <Search size={16} />
      <span className="hidden w-full whitespace-nowrap text-sm lg:block">
        <FormattedMessage
          defaultMessage="Search {slash}" id="NIZcsy"
          values={{ slash: <span className="ml-1 rounded-sm border bg-slate-100 px-1">/</span> }}
        />
      </span>
    </button>
  );
};

export default SearchTrigger;
