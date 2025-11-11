'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { sortBy, truncate } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isEmail } from 'validator';
import { Search, Plus, UserPlus, Building2, User, Check, ChevronDown, X } from 'lucide-react';

import { CollectiveType } from '../lib/constants/collectives';
import { cn } from '../lib/utils';

import { Button } from './ui/Button';
import { BASE_INPUT_CLASS, Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/Dialog';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';
import { Checkbox } from './ui/Checkbox';
import { Command, CommandEmpty, CommandInput, CommandGroup, CommandItem, CommandList } from './ui/Command';
import Avatar from './Avatar';
import CreateCollectiveMiniForm from './CreateCollectiveMiniForm';
import { Command as CommandPrimitive } from 'cmdk';
import formatAccountType from '@/lib/i18n/account-type';
import Image from '@/components/Image';
import { Skeleton } from './ui/Skeleton';
import { Separator } from './ui/Separator';
import formatCollectiveType from '@/lib/i18n/collective-type';

// TypeScript interfaces
type CollectiveTypeValue = (typeof CollectiveType)[keyof typeof CollectiveType];

interface Collective {
  id: string;
  name: string;
  slug?: string;
  email?: string;
  type: CollectiveTypeValue;
  status?: string;
}

interface OptionType {
  value: Collective;
  label?: string;
  isDisabled?: boolean;
}

interface AccountPickerProps {
  inputId?: string;
  collectives?: Collective[];
  creatable?: boolean | CollectiveTypeValue[];
  customOptions?: OptionType[];
  formatOptionLabel?: (option: OptionType, context?: any) => React.ReactNode;
  getDefaultOptions?: (buildOption: (c: Collective) => OptionType, allOptions: OptionType[]) => OptionType;
  groupByType?: boolean;
  onInvite?: (value: boolean) => void;
  sortFunc?: (collectives: Collective[]) => Collective[];
  types?: CollectiveTypeValue[];
  isDisabled?: boolean;
  menuIsOpen?: boolean;
  minWidth?: string | number;
  maxWidth?: string | number;
  width?: string | number;
  addLoggedInUserAsAdmin?: boolean;
  renderNewCollectiveOption?: () => React.ReactNode;
  isSearchable?: boolean;
  expenseType?: string;
  useBeneficiaryForVendor?: boolean;
  onChange?: (value: Collective | Collective[] | null) => void;
  onInputChange?: (value: string) => void;
  onCreateClick?: (type: CollectiveTypeValue) => void;
  collective?: Collective | Collective[] | null;
  isMulti?: boolean;
  getOptions?: (buildOption: (c: Collective) => OptionType) => OptionType;
  customOptionsPosition?: 'TOP' | 'BOTTOM';
  invitable?: boolean;
  excludeAdminFields?: string[];
  createCollectiveOptionalFields?: string[];
  HostCollectiveId?: string;
  styles?: any;
  menuPortalTarget?: HTMLElement | null;
  placeholder?: string;
  className?: string;
  AccountMeta?: React.ComponentType<{ account: Collective }>;
  onMenuScrollToBottom?: () => void;
  isLoadingMoreResults?: boolean;
  isLoading?: boolean;
}

const Messages = defineMessages({
  createNew: {
    id: 'CollectivePicker.CreateNew',
    defaultMessage: 'Create new',
  },
  inviteNew: {
    id: 'CollectivePicker.InviteSomeone',
    defaultMessage: 'Invite someone to submit an expense',
  },
  inviteNewUser: {
    id: 'User.InviteNew',
    defaultMessage: 'Invite new User',
  },
  createOrganization: {
    id: 'organization.create',
    defaultMessage: 'Create Organization',
  },
  createCollective: {
    id: 'collective.create',
    defaultMessage: 'Create Collective',
  },
  createBeneficiary: {
    id: 'AzRKUx',
    defaultMessage: 'Create Beneficiary',
  },
  createVendor: {
    id: 'I5p2+k',
    defaultMessage: 'Create Vendor',
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

/** Return the caption associated to a given collective type */
const getTypeCaption = (intl, type: CollectiveTypeValue, { useBeneficiaryForVendor = false }) => {
  if (type === CollectiveType.USER) {
    return intl.formatMessage(Messages.inviteNewUser);
  } else if (type === CollectiveType.ORGANIZATION) {
    return intl.formatMessage(Messages.createOrganization);
  } else if (type === CollectiveType.COLLECTIVE) {
    return intl.formatMessage(Messages.createCollective);
  } else if (type === CollectiveType.VENDOR) {
    return useBeneficiaryForVendor
      ? intl.formatMessage(Messages.createBeneficiary)
      : intl.formatMessage(Messages.createVendor);
  }
  return null;
};

/**
 * An overset og `StyledSelect` specialized to display, filter and pick a collective from a given list.
 * Accepts all the props from [StyledSelect](#!/StyledSelect).
 *
 * If you want the collectives to be automatically loaded from the API, check `CollectivePickerAsync`.
 */
const AccountPicker: React.FC<AccountPickerProps> = props => {
  const {
    inputId,
    collectives = [],
    creatable,
    customOptions,
    formatOptionLabel = DefaultAccountLabel,
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
    AccountMeta,
    onMenuScrollToBottom,
    isLoadingMoreResults = false,
    isLoading,
    ...restProps
  } = props;

  const intl = useIntl();
  const scrollRef = useRef(null);

  // Modern state management
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(menuIsOpenProp || false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [displayedResults, setDisplayedResults] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Legacy state for compatibility
  const [createFormCollectiveType, setCreateFormCollectiveType] = useState<CollectiveTypeValue | null>(null);
  const [createdCollectives, setCreatedCollectives] = useState<Collective[]>([]);

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
  const currentSelectedCollectives = useMemo((): Collective[] => {
    if (isMulti) {
      return Array.isArray(collective) ? collective : [];
    }
    return collective && !Array.isArray(collective) ? [collective] : [];
  }, [collective, isMulti]);

  const selectedIds = useMemo(() => {
    return new Set(currentSelectedCollectives.map(acc => acc.id));
  }, [currentSelectedCollectives]);

  // Build all options with value and label, including custom options
  const allOptions = useMemo((): OptionType[] => {
    // Build options from filtered collectives
    const collectiveOptions: OptionType[] = filteredCollectives.map(collective => ({
      value: collective,
      label: collective.name,
    }));

    // Don't include custom options when searching
    if (searchQuery.trim()) {
      return collectiveOptions;
    }

    // Merge with custom options if they exist (only when not searching)
    if (!customOptions || customOptions.length === 0) {
      return collectiveOptions;
    }

    // Add custom options at the top or bottom based on customOptionsPosition
    if (customOptionsPosition === CUSTOM_OPTIONS_POSITION.BOTTOM) {
      return [...collectiveOptions, ...customOptions];
    } else {
      // Default to TOP
      return [...customOptions, ...collectiveOptions];
    }
  }, [filteredCollectives, customOptions, customOptionsPosition, searchQuery]);

  const hasMoreResults = useMemo(() => {
    // If we're doing API pagination, don't limit display locally
    if (onMenuScrollToBottom) {
      return false;
    }

    return allOptions.length > displayedResults;
  }, [allOptions, displayedResults, onMenuScrollToBottom]);

  // Event handlers
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isLoadingMore || isLoadingMoreResults) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      // If API pagination is enabled, call the callback
      if (onMenuScrollToBottom) {
        onMenuScrollToBottom();
      }
      // Otherwise, load more from local data if available
      else if (hasMoreResults) {
        setIsLoadingMore(true);
        // Simulate loading delay
        setTimeout(() => {
          setDisplayedResults(prev => Math.min(prev + 10, filteredCollectives.length));
          setIsLoadingMore(false);
        }, 300);
      }
    }
  }, [hasMoreResults, isLoadingMore, isLoadingMoreResults, filteredCollectives.length, onMenuScrollToBottom]);

  const handleInviteAccount = useCallback(() => {
    const invitedAccount: Collective = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      type: CollectiveType.USER,
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
        // Check if the clicked option is already selected
        const isSelected = currentSelectedCollectives.some(acc => acc.id === selectedCollective.id);

        if (isSelected) {
          // Deselect by passing null
          onChangeProp?.(null);
        } else {
          // Select the new option
          onChangeProp?.(selectedCollective);
        }

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

  // Determine which types are available for creation
  const creatableTypes = useMemo(() => {
    if (!creatable) return [];
    if (typeof creatable === 'object' && Array.isArray(creatable)) {
      return creatable;
    }
    return types || [];
  }, [creatable, types]);

  return (
    <div className={cn('relative', className)} style={{ minWidth, maxWidth, width }}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={isDisabled}
            className="min-h-12 w-full justify-between bg-background hover:bg-accent/50"
          >
            {currentSelectedCollectives.length > 0 ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {isMulti ? (
                  currentSelectedCollectives.length === 1 ? (
                    formatOptionLabel({ value: currentSelectedCollectives[0] } as OptionType, undefined)
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
                ) : !Array.isArray(collective) && collective ? (
                  formatOptionLabel({ value: collective } as OptionType, undefined)
                ) : null}
              </div>
            ) : (
              <span className="text-muted-foreground"> {isMulti ? 'Select Accounts' : 'Select Account'}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false} className="rounded-none border-0 bg-transparent">
            <div className="">
              {/* Header */}
              {/* <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {isMulti ? 'Select Accounts' : 'Select Account'}
                  {isMulti && currentSelectedCollectives.length > 0 && (
                    <span className="ml-1 text-muted-foreground">({currentSelectedCollectives.length})</span>
                  )}
                </span>
              </div> */}

              {/* Search */}
              {isSearchable && (
                <div className="relative p-0">
                  {/* <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 transform text-muted-foreground" /> */}
                  <CommandInput
                    placeholder={placeholder}
                    value={searchQuery}
                    onValueChange={val => handleInputChange(val)}
                    // className="h-8 pl-8 text-sm"
                    // wrapperClass={BASE_INPUT_CLASS}
                  />
                </div>
              )}

              {/* Action buttons */}
              {(creatable || invitable) && (
                <React.Fragment>
                  <div className="flex max-w-full items-center gap-2 px-3">
                    <Separator className="flex-1" /> <div className="text-xs font-medium text-muted-foreground">OR</div>
                    <Separator className="flex-1" />
                  </div>
                  <div className="flex gap-2 p-2">
                    {creatable &&
                      creatableTypes.map(type => (
                        <Button
                          key={type}
                          variant="outline"
                          size="xs"
                          className="whitespace-nowrap"
                          onClick={() => {
                            if (typeof onCreateClick === 'function') {
                              onChangeProp?.(null);
                              setIsOpen(false);
                              onCreateClick(type);
                            } else {
                              setCreateFormCollectiveType(type);
                            }
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {getTypeCaption(intl, type, { useBeneficiaryForVendor })}
                        </Button>
                      ))}

                    {invitable && (
                      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full justify-start bg-transparent text-sm font-medium"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite someone by email
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
                </React.Fragment>
              )}

              {/* Results */}
              <CommandList
                ref={scrollRef}
                onScroll={handleScroll}
                className="max-h-90 space-y-1 overflow-y-auto border-0 border-t p-1"
              >
                {/* All items */}
                {allOptions.length > 0 && (
                  <CommandGroup className="gap-1 p-0 [&_[cmdk-group-heading]]:rounded [&_[cmdk-group-heading]]:bg-muted/30 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                    {allOptions
                      .slice(
                        0,
                        // If API pagination is enabled, show all results
                        onMenuScrollToBottom ? allOptions.length : displayedResults,
                      )
                      .map(option => {
                        const isSelected = isCollectiveSelected(option.value.id);
                        return (
                          <CommandItem
                            key={option.value.id}
                            value={`${option.value.id}-${option.value.name}`}
                            onSelect={() => handleCollectiveSelect(option.value)}
                            disabled={option.isDisabled}
                            className={cn(
                              'flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-accent/50 aria-selected:bg-accent/50 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
                              isSelected && 'border border-primary/20 bg-primary/10 data-[selected=true]:bg-primary/10',
                            )}
                          >
                            {isMulti && <Checkbox checked={isSelected} className="pointer-events-none" />}
                            {formatOptionLabel ? formatOptionLabel(option, undefined) : option.label}
                            {!isMulti && isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                          </CommandItem>
                        );
                      })}
                  </CommandGroup>
                )}

                {(isLoadingMore || isLoadingMoreResults || isLoading) &&
                  Array.from({ length: 20 }, (_, i) => i + 1).map(id => <LoadingResult key={`skeleton-${id}`} />)}

                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  <div>
                    <div className="relative flex items-center justify-center rounded-full">
                      <Image
                        alt="No results found illustration with a magnifying glass."
                        className="z-10 h-40 w-40"
                        src="/static/images/no-results.png"
                        width={160}
                        height={160}
                      />
                    </div>
                  </div>
                  No results
                </CommandEmpty>
              </CommandList>
            </div>
          </Command>
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

export default AccountPicker;

function DefaultMetaRender({ account }) {
  const intl = useIntl();
  return (
    <Badge size="sm" type="outline">
      {formatAccountType(intl, account.type)}
    </Badge>
  );
}

export function DefaultAccountLabel({ value: account }, context) {
  const intl = useIntl();
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Avatar collective={account} radius={20} />
      <div className="flex min-w-0 flex-1 flex-col items-start truncate overflow-hidden">
        <span className="truncate text-sm font-medium">{account.name}</span>{' '}
        <span className="truncate text-xs text-muted-foreground">@{account.slug}</span>
        {/* abillity to show email? */}
      </div>

      <Badge size="sm" type="outline">
        {formatCollectiveType(intl, account.type)}
      </Badge>
    </div>
  );
}
function LoadingResult() {
  return (
    <div className="flex items-center gap-2 px-2 py-3">
      <Skeleton className="size-9 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
