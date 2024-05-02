import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { Dialog, DialogContent, DialogTrigger } from './ui/Dialog';
import SearchForm from './SearchForm';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from './ui/Command';
import { useSidebar } from './SidebarContext';
import { Search } from 'lucide-react';
import { AccountRenderer } from './dashboard/filters/HostedAccountFilter';
/*
 * A modal that appears on top of the page containing a search field.
 */
const SearchModal = ({ trigger = undefined }) => {
  const intl = useIntl();
  const [open, setOpen] = React.useState(false);
  const onClose = () => setOpen(false);

  React.useEffect(() => {
    const handleKeydown = e => {
      if (e.key === '/' && e.target.tagName === 'BODY') {
        e.preventDefault();
        setOpen(show => !show);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);
  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        setOpen(open);
        // console.log('open', open);
        // if (open) {
        //   setInput(`account:${account?.slug}`);
        // }
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <button
            className="relative flex h-10 w-10 shrink items-center justify-center gap-2 rounded-md text-left font-medium text-muted-foreground ring-black ring-offset-2 hover:bg-muted focus:outline-none focus-visible:ring-2 lg:w-[512px] lg:justify-start lg:px-2.5 lg:pr-4"
            onClick={() => setOpen(true)}
          >
            <Search size={16} />
            <span className="hidden w-full whitespace-nowrap text-sm lg:block">
              <FormattedMessage
                defaultMessage="Search {slash}" id="NIZcsy"
                values={{ slash: <span className="ml-1 rounded-sm border bg-slate-100 px-1">/</span> }}
              />
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="p-0">
        <SearchCommand />
        {/* <SearchForm
          autoFocus
          borderColor="transparent"
          overflow="hidden"
          fontSize="14px"
          height="48px"
          placeholder={intl.formatMessage({
            defaultMessage: 'Search for Collectives, organizations, and more...',
            id: 'LOtm7B',
          })}
          showSearchButton
          searchButtonStyles={{ width: '32px', height: '32px' }}
          closeSearchModal={onClose}
        /> */}
      </DialogContent>
    </Dialog>
  );
};

const SearchCommand = () => {
  const [search, setSearch] = React.useState('');
  const { account } = useSidebar();
  const [pages, setPages] = React.useState([account.slug]);
  const page = pages[pages.length - 1];

  return (
    <Command
      onKeyDown={e => {
        // Escape goes to previous page
        // Backspace goes to previous page when search is empty
        if (e.key === 'Escape' || (e.key === 'Backspace' && !search)) {
          e.preventDefault();
          setPages(pages => pages.slice(0, -1));
        }
      }}
    >
      <div className="flex items-center gap-1 px-3">
        {pages.map((page, index) => (
          <div className="rounded bg-blue-100 px-1 py-0.5 text-xs">
            <AccountRenderer key={page} account={{ slug: page }} />
          </div>
        ))}
        <CommandInput hideIcon placeholder="Search..." value={search} onValueChange={setSearch} />
      </div>
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!page && (
          <CommandGroup>
            <CommandItem onSelect={() => setPages([...pages, 'projects'])}>Search projects…</CommandItem>
            <CommandItem onSelect={() => setPages([...pages, 'teams'])}>Join a team…</CommandItem>
          </CommandGroup>
        )}

        {page && (
          <CommandGroup>
            <CommandItem>
              account:{account.slug} {search}
              <span className="ml-auto text-muted-foreground">Search in this account</span>
            </CommandItem>

            {account.isHost && (
              <CommandItem>
                host:{account.slug} {search} <span className="ml-auto text-muted-foreground">Search in this host</span>
              </CommandItem>
            )}

            {search && (
              <CommandItem>
                {search} <span className="ml-auto text-muted-foreground">Search all of Open Collective</span>
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {page === 'teams' && (
          <>
            <CommandItem>Team 1</CommandItem>
            <CommandItem>Team 2</CommandItem>
          </>
        )}

        <CommandGroup heading="Recent searches">
          <CommandItem>Transactions</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Billing</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

SearchModal.propTypes = {
  setOpen: PropTypes.func,
  open: PropTypes.bool,
};

export default SearchModal;
