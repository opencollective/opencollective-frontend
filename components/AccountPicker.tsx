'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { sortBy, truncate } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isEmail } from 'validator';
import { Search, Plus, UserPlus, Building2, User, Check, ChevronDown, X } from 'lucide-react';

import { CollectiveType } from '../lib/constants/collectives';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { Checkbox } from './ui/Checkbox';
import Avatar from './Avatar';
import CreateCollectiveMiniForm from './CreateCollectiveMiniForm';

const Messages = defineMessages({
  createNew: {
    id: 'CollectivePicker.CreateNew',
    defaultMessage: 'Create new',
  },
  inviteNew: {
    id: 'CollectivePicker.InviteNew',
    defaultMessage: 'Invite new',
  },
});

/**
 * Default label builder used to render a collective. For sections titles and custom options,
 * this will just return the default label.
 */
export const DefaultCollectiveLabel = ({ value: collective }, context) => {
  const selected = (context?.selectValue ?? []).some(o => o.value.slug === collective.slug);
  return !collective ? (
    <span className="text-xs leading-[18px] text-slate-500">
      <FormattedMessage defaultMessage="No collective" id="159cQ8" />
    </span>
  ) : (
    <div className="flex items-center gap-2">
      <Avatar collective={collective} radius={24} />
      <div className="flex min-w-0 flex-1 flex-col text-left" role="option" aria-selected={selected}>
        <span className="truncate text-xs leading-[18px] font-medium text-slate-700">
          {truncate(collective.name, { length: 40 })}
        </span>
        <span className="truncate text-xs leading-[13px] text-slate-500">
          {collective.slug && collective.type !== 'VENDOR' ? `@${collective.slug}` : collective.email || ''}
        </span>
      </div>
    </div>
  );
};

// Some flags to differentiate options in the picker
export const FLAG_COLLECTIVE_PICKER_COLLECTIVE = '__collective_picker_collective__';
export const FLAG_NEW_COLLECTIVE = '__collective_picker_new__';

export const CUSTOM_OPTIONS_POSITION = {
  TOP: 'TOP',
  BOTTOM: 'BOTTOM',
};

// Utility functions from prototype
const getAccountIcon = type => {
  switch (type) {
    case 'ORGANIZATION':
    case 'business':
      return <Building2 className="h-4 w-4" />;
    case 'team':
      return <User className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getStatusBadge = status => {
  switch (status) {
    case 'pending':
      return (
        <Badge type="warning" size="xs" className="text-xs">
          Pending
        </Badge>
      );
    case 'invited':
      return (
        <Badge type="outline" size="xs" className="text-xs">
          Invited
        </Badge>
      );
    default:
      return null;
  }
};

/**
 * An overset og `StyledSelect` specialized to display, filter and pick a collective from a given list.
 * Accepts all the props from [StyledSelect](#!/StyledSelect).
 *
 * If you want the collectives to be automatically loaded from the API, check `CollectivePickerAsync`.
 */
const CollectivePicker = props => {
  const {
    inputId,
    collectives = [],
    creatable,
    customOptions,
    formatOptionLabel,
    getDefaultOptions,
    groupByType,
    onInvite,
    sortFunc,
    types,
    isDisabled,
    menuIsOpen: menuIsOpenProp,
    minWidth,
    maxWidth,
    width,
    addLoggedInUserAsAdmin,
    renderNewCollectiveOption,
    isSearchable = true,
    expenseType,
    useBeneficiaryForVendor,
    onChange: onChangeProp,
    onInputChange: onInputChangeProp,
    onCreateClick,
    collective,
    isMulti,
    getOptions,
    customOptionsPosition,
    invitable,
    excludeAdminFields,
    createCollectiveOptionalFields,
    HostCollectiveId,
    styles,
    menuPortalTarget,
    placeholder = 'Select account...',
    className,
    ...restProps
  } = props;

  const intl = useIntl();
  const scrollRef = useRef(null);

  // Modern state management
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(menuIsOpenProp || false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [displayedResults, setDisplayedResults] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Legacy state for compatibility
  const [createFormCollectiveType, setCreateFormCollectiveType] = useState(null);
  const [createdCollectives, setCreatedCollectives] = useState([]);

  // Filter collectives based on search query
  const filteredCollectives = useMemo(() => {
    if (!collectives || collectives.length === 0) return [];

    if (!searchQuery.trim()) return collectives;

    const normalizedQuery = searchQuery.toLowerCase();
    return collectives.filter(
      collective =>
        collective.name?.toLowerCase().includes(normalizedQuery) ||
        collective.email?.toLowerCase().includes(normalizedQuery) ||
        collective.slug?.toLowerCase().includes(normalizedQuery),
    );
  }, [collectives, searchQuery]);

  // Get selected collectives for multi-select
  const currentSelectedCollectives = useMemo(() => {
    if (isMulti) {
      return Array.isArray(collective) ? collective : [];
    }
    return collective ? [collective] : [];
  }, [collective, isMulti]);

  const selectedIds = useMemo(() => {
    return new Set(currentSelectedCollectives.map(acc => acc.id));
  }, [currentSelectedCollectives]);

  // Separate selected and unselected collectives
  const selectedCollectivesInResults = useMemo(() => {
    return filteredCollectives.filter(coll => selectedIds.has(coll.id));
  }, [filteredCollectives, selectedIds]);

  const unselectedCollectivesInResults = useMemo(() => {
    return filteredCollectives.filter(coll => !selectedIds.has(coll.id));
  }, [filteredCollectives, selectedIds]);

  const hasMoreResults = useMemo(() => {
    if (searchQuery.trim() !== '') {
      return selectedCollectivesInResults.length + unselectedCollectivesInResults.length > displayedResults;
    }
    return unselectedCollectivesInResults.length > displayedResults;
  }, [searchQuery, selectedCollectivesInResults, unselectedCollectivesInResults, displayedResults]);

  // Event handlers
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMoreResults || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setIsLoadingMore(true);
      // Simulate loading delay
      setTimeout(() => {
        setDisplayedResults(prev => Math.min(prev + 10, filteredCollectives.length));
        setIsLoadingMore(false);
      }, 300);
    }
  }, [hasMoreResults, isLoadingMore, filteredCollectives.length]);

  const handleCreateAccount = useCallback(() => {
    const newAccount = {
      id: Date.now().toString(),
      name: newAccountName,
      email: newAccountEmail,
      type: 'USER',
      status: 'active',
    };

    if (isMulti) {
      onChangeProp?.([...currentSelectedCollectives, newAccount]);
    } else {
      onChangeProp?.(newAccount);
      setIsOpen(false);
    }

    setIsCreateDialogOpen(false);
    setNewAccountName('');
    setNewAccountEmail('');
    setCreatedCollectives(prev => [...prev, newAccount]);
  }, [newAccountName, newAccountEmail, isMulti, currentSelectedCollectives, onChangeProp]);

  const handleInviteAccount = useCallback(() => {
    const invitedAccount = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      type: 'USER',
      status: 'invited',
    };

    if (isMulti) {
      onChangeProp?.([...currentSelectedCollectives, invitedAccount]);
    } else {
      onChangeProp?.(invitedAccount);
      setIsOpen(false);
    }

    setIsInviteDialogOpen(false);
    setInviteEmail('');
    setInviteMessage('');
  }, [inviteEmail, isMulti, currentSelectedCollectives, onChangeProp]);

  const handleCollectiveSelect = useCallback(
    selectedCollective => {
      if (isMulti) {
        const isSelected = currentSelectedCollectives.some(acc => acc.id === selectedCollective.id);
        let newSelection;

        if (isSelected) {
          newSelection = currentSelectedCollectives.filter(acc => acc.id !== selectedCollective.id);
        } else {
          newSelection = [...currentSelectedCollectives, selectedCollective];
        }

        onChangeProp?.(newSelection);
      } else {
        onChangeProp?.(selectedCollective);
        setIsOpen(false);
      }
    },
    [isMulti, currentSelectedCollectives, onChangeProp],
  );

  const removeSelectedCollective = useCallback(
    (collectiveId, e) => {
      e.stopPropagation();
      if (isMulti) {
        const newSelection = currentSelectedCollectives.filter(acc => acc.id !== collectiveId);
        onChangeProp?.(newSelection);
      }
    },
    [isMulti, currentSelectedCollectives, onChangeProp],
  );

  const isCollectiveSelected = useCallback(
    collectiveId => {
      return currentSelectedCollectives.some(acc => acc.id === collectiveId);
    },
    [currentSelectedCollectives],
  );

  // Handle search input changes
  const handleInputChange = useCallback(
    newTerm => {
      setSearchQuery(newTerm);
      setDisplayedResults(10); // Reset pagination on search
      onInputChangeProp?.(newTerm);
    },
    [onInputChangeProp],
  );

  // Reset displayed results when search changes
  React.useEffect(() => {
    setDisplayedResults(10);
  }, [searchQuery]);

  const prefillValue = isEmail(searchQuery) ? { email: searchQuery } : { name: searchQuery };

  return (
    <div className={cn('relative', className)} style={{ minWidth, maxWidth, width }}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={isDisabled}
            className="min-h-9 w-full justify-between bg-background hover:bg-accent/50"
          >
            {currentSelectedCollectives.length > 0 ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isMulti ? (
                  currentSelectedCollectives.length === 1 ? (
                    <>
                      <Avatar collective={currentSelectedCollectives[0]} radius={20} />
                      <div className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="truncate text-sm font-medium">{currentSelectedCollectives[0].name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {currentSelectedCollectives[0].email || currentSelectedCollectives[0].slug}
                        </span>
                      </div>
                      {getAccountIcon(currentSelectedCollectives[0].type)}
                    </>
                  ) : (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                      {currentSelectedCollectives.slice(0, 2).map(collective => (
                        <Badge
                          key={collective.id}
                          type="neutral"
                          size="sm"
                          className="flex max-w-32 items-center gap-1"
                        >
                          <Avatar collective={collective} radius={12} />
                          <span className="truncate text-xs">{collective.name}</span>
                          <button
                            onClick={e => removeSelectedCollective(collective.id, e)}
                            className="rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                      {currentSelectedCollectives.length > 2 && (
                        <Badge type="outline" size="sm" className="text-xs">
                          +{currentSelectedCollectives.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    <Avatar collective={collective} radius={20} />
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <span className="truncate text-sm font-medium">{collective?.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {collective?.email || collective?.slug}
                      </span>
                    </div>
                    {getAccountIcon(collective?.type)}
                  </>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="space-y-3 p-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isMulti ? 'Select Accounts' : 'Select Account'}
                {isMulti && currentSelectedCollectives.length > 0 && (
                  <span className="ml-1 text-muted-foreground">({currentSelectedCollectives.length})</span>
                )}
              </span>
            </div>

            {/* Search */}
            {isSearchable && (
              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={e => handleInputChange(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            )}

            {/* Action buttons */}
            {(creatable || invitable) && (
              <div className="flex gap-2">
                {creatable && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 flex-1 bg-transparent text-sm font-medium">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Account</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Account Name</Label>
                          <Input
                            id="name"
                            value={newAccountName}
                            onChange={e => setNewAccountName(e.target.value)}
                            placeholder="Enter account name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newAccountEmail}
                            onChange={e => setNewAccountEmail(e.target.value)}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateAccount} disabled={!newAccountName || !newAccountEmail}>
                            Create Account
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {invitable && (
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 flex-1 bg-transparent text-sm font-medium">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite Account</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="Enter email to invite"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Invitation Message (Optional)</Label>
                          <Textarea
                            id="message"
                            value={inviteMessage}
                            onChange={e => setInviteMessage(e.target.value)}
                            placeholder="Add a personal message..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleInviteAccount} disabled={!inviteEmail}>
                            Send Invite
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* Results */}
            <div ref={scrollRef} onScroll={handleScroll} className="max-h-60 space-y-1 overflow-y-auto">
              {/* Selected items */}
              {currentSelectedCollectives.length > 0 && (
                <>
                  <div className="rounded bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">
                    Selected
                  </div>
                  {(searchQuery.trim() === '' ? currentSelectedCollectives : selectedCollectivesInResults).map(
                    collective => (
                      <div
                        key={collective.id}
                        onClick={() => handleCollectiveSelect(collective)}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-primary/20 bg-primary/10 p-2 text-sm transition-colors hover:bg-accent/50"
                      >
                        {isMulti && <Checkbox checked={true} className="pointer-events-none" />}

                        <Avatar collective={collective} radius={24} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium">{collective.name}</p>
                            {getAccountIcon(collective.type)}
                            {getStatusBadge(collective.status)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs text-muted-foreground">
                              {collective.email || collective.slug}
                            </p>
                            {collective.role && (
                              <Badge type="outline" size="xs" className="h-4 px-1 text-xs">
                                {collective.role}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {!isMulti && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    ),
                  )}
                </>
              )}

              {/* Available items */}
              {unselectedCollectivesInResults.length > 0 && (
                <>
                  <div className="rounded bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">
                    {unselectedCollectivesInResults.length} result
                    {unselectedCollectivesInResults.length !== 1 ? 's' : ''}
                  </div>
                  {unselectedCollectivesInResults
                    .slice(
                      0,
                      searchQuery.trim() === ''
                        ? displayedResults
                        : displayedResults - selectedCollectivesInResults.length,
                    )
                    .map(collective => (
                      <div
                        key={collective.id}
                        onClick={() => handleCollectiveSelect(collective)}
                        className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-accent/50"
                      >
                        {isMulti && (
                          <Checkbox checked={isCollectiveSelected(collective.id)} className="pointer-events-none" />
                        )}

                        <Avatar collective={collective} radius={24} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium">{collective.name}</p>
                            {getAccountIcon(collective.type)}
                            {getStatusBadge(collective.status)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs text-muted-foreground">
                              {collective.email || collective.slug}
                            </p>
                            {collective.role && (
                              <Badge type="outline" size="xs" className="h-4 px-1 text-xs">
                                {collective.role}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {!isMulti && isCollectiveSelected(collective.id) && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    ))}
                </>
              )}

              {isLoadingMore && (
                <div className="flex items-center justify-center py-2">
                  <div className="text-xs text-muted-foreground">Loading more...</div>
                </div>
              )}

              {filteredCollectives.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">No accounts found</div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Legacy create form modal */}
      {createFormCollectiveType && (
        <Dialog open={!!createFormCollectiveType} onOpenChange={() => setCreateFormCollectiveType(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Collective</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <CreateCollectiveMiniForm
                type={createFormCollectiveType}
                onCancel={() => setCreateFormCollectiveType(null)}
                addLoggedInUserAsAdmin={addLoggedInUserAsAdmin}
                excludeAdminFields={excludeAdminFields}
                optionalFields={createCollectiveOptionalFields}
                onSuccess={collective => {
                  onChangeProp?.(collective);
                  setCreateFormCollectiveType(null);
                  setCreatedCollectives(prev => [...prev, collective]);
                  setIsOpen(false);
                }}
                otherInitialValues={
                  createFormCollectiveType === CollectiveType.VENDOR ? { ParentCollectiveId: HostCollectiveId } : {}
                }
                {...prefillValue}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

CollectivePicker.defaultProps = {
  groupByType: true,
  getDefaultOptions: () => undefined,
  getOptions: () => undefined,
  formatOptionLabel: DefaultCollectiveLabel,
  sortFunc: collectives => sortBy(collectives, 'name'),
};

export default CollectivePicker;
