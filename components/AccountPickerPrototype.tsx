'use client';

import type React from 'react';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, UserPlus, Building2, User, Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Avatar from './Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  name: string;
  email: string;
  type: 'personal' | 'business' | 'team';
  avatar?: string;
  role?: string;
  status: 'active' | 'pending' | 'invited';
}

const mockAccounts: Account[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    type: 'personal',
    avatar: '/professional-headshot.png',
    status: 'active',
  },
  {
    id: '2',
    name: 'Acme Corp',
    email: 'team@acme.com',
    type: 'business',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '3',
    name: 'Design Team',
    email: 'design@company.com',
    type: 'team',
    role: 'Member',
    status: 'active',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@startup.io',
    type: 'personal',
    status: 'pending',
  },
  // Additional accounts to simulate larger dataset
  {
    id: '5',
    name: 'Marketing Team',
    email: 'marketing@company.com',
    type: 'team',
    role: 'Member',
    status: 'active',
  },
  {
    id: '6',
    name: 'Tech Solutions Inc',
    email: 'contact@techsolutions.com',
    type: 'business',
    role: 'Owner',
    status: 'active',
  },
  {
    id: '7',
    name: 'Alice Johnson',
    email: 'alice@freelance.com',
    type: 'personal',
    status: 'active',
  },
  {
    id: '8',
    name: 'Development Team',
    email: 'dev@company.com',
    type: 'team',
    role: 'Lead',
    status: 'active',
  },
  {
    id: '9',
    name: 'Global Enterprises',
    email: 'admin@global.com',
    type: 'business',
    role: 'Admin',
    status: 'active',
  },
  {
    id: '10',
    name: 'Bob Smith',
    email: 'bob@contractor.com',
    type: 'personal',
    status: 'invited',
  },
  // Add more accounts to test infinite scroll
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `generated-${i + 11}`,
    name: `User ${i + 11}`,
    email: `user${i + 11}@example.com`,
    type: 'personal' as const,
    status: 'active' as const,
  })),
];

const suggestedAccounts = mockAccounts.slice(0, 4);

interface AccountPickerProps {
  selectedAccount?: Account;
  selectedAccounts?: Account[];
  onAccountSelect?: (account: Account) => void;
  onAccountsSelect?: (accounts: Account[]) => void;
  multiSelect?: boolean;
  className?: string;
  placeholder?: string;
}

export function AccountPicker({
  selectedAccount,
  selectedAccounts = [],
  onAccountSelect,
  onAccountsSelect,
  multiSelect = false,
  className,
  placeholder = 'Select account...',
}: AccountPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const [displayedResults, setDisplayedResults] = useState(10);
  const [displayedBaseResults, setDisplayedBaseResults] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredAccounts = mockAccounts.filter(
    account =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentSelectedAccounts = multiSelect ? selectedAccounts : selectedAccount ? [selectedAccount] : [];
  const selectedIds = new Set(currentSelectedAccounts.map(acc => acc.id));

  const selectedAccountsInResults = filteredAccounts.filter(account => selectedIds.has(account.id));
  const unselectedAccountsInResults = filteredAccounts.filter(account => !selectedIds.has(account.id));

  const unselectedSuggestedAccounts = mockAccounts.filter(account => !selectedIds.has(account.id));

  const accountsToShow =
    searchQuery.trim() === ''
      ? [
          ...currentSelectedAccounts, // Show currently selected accounts first
          ...unselectedSuggestedAccounts.slice(0, displayedBaseResults), // Then all accounts that aren't selected with pagination
        ]
      : [
          ...selectedAccountsInResults, // Show selected accounts first in search results
          ...unselectedAccountsInResults.slice(0, displayedResults - selectedAccountsInResults.length),
        ];

  const hasMoreResults =
    searchQuery.trim() !== ''
      ? selectedAccountsInResults.length + unselectedAccountsInResults.length > displayedResults
      : unselectedSuggestedAccounts.length > displayedBaseResults;

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMoreResults || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setIsLoadingMore(true);
      // Simulate loading delay
      setTimeout(() => {
        if (searchQuery.trim() !== '') {
          setDisplayedResults(prev => Math.min(prev + 10, filteredAccounts.length));
        } else {
          setDisplayedBaseResults(prev => Math.min(prev + 10, unselectedSuggestedAccounts.length));
        }
        setIsLoadingMore(false);
      }, 300);
    }
  }, [hasMoreResults, isLoadingMore, filteredAccounts.length, searchQuery, unselectedSuggestedAccounts.length]);

  useEffect(() => {
    setDisplayedResults(10);
    setDisplayedBaseResults(10);
  }, [searchQuery]);

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'business':
        return <Building2 className="h-4 w-4" />;
      case 'team':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Account['status']) => {
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

  const handleCreateAccount = () => {
    const newAccount: Account = {
      id: Date.now().toString(),
      name: newAccountName,
      email: newAccountEmail,
      type: 'personal',
      status: 'active',
    };

    if (multiSelect) {
      onAccountsSelect?.([...selectedAccounts, newAccount]);
    } else {
      onAccountSelect?.(newAccount);
      setIsOpen(false);
    }

    setIsCreateDialogOpen(false);
    setNewAccountName('');
    setNewAccountEmail('');
  };

  const handleInviteAccount = () => {
    const invitedAccount: Account = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      type: 'personal',
      status: 'invited',
    };

    if (multiSelect) {
      onAccountsSelect?.([...selectedAccounts, invitedAccount]);
    } else {
      onAccountSelect?.(invitedAccount);
      setIsOpen(false);
    }

    setIsInviteDialogOpen(false);
    setInviteEmail('');
    setInviteMessage('');
  };

  const handleAccountSelect = (account: Account) => {
    if (multiSelect) {
      const isSelected = selectedAccounts.some(acc => acc.id === account.id);
      let newSelection: Account[];

      if (isSelected) {
        newSelection = selectedAccounts.filter(acc => acc.id !== account.id);
      } else {
        newSelection = [...selectedAccounts, account];
      }

      onAccountsSelect?.(newSelection);
    } else {
      onAccountSelect?.(account);
      setIsOpen(false);
    }
  };

  const removeSelectedAccount = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiSelect) {
      const newSelection = selectedAccounts.filter(acc => acc.id !== accountId);
      onAccountsSelect?.(newSelection);
    }
  };

  const isAccountSelected = (accountId: string) => {
    return currentSelectedAccounts.some(acc => acc.id === accountId);
  };

  return (
    <div className={cn('relative', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="min-h-9 w-full justify-between bg-background hover:bg-accent/50"
          >
            {currentSelectedAccounts.length > 0 ? (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {multiSelect ? (
                  currentSelectedAccounts.length === 1 ? (
                    <>
                      <Avatar
                        collective={{ name: currentSelectedAccounts[0].name, image: currentSelectedAccounts[0].avatar }}
                        radius={20}
                      />
                      <div className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="truncate text-sm font-medium">{currentSelectedAccounts[0].name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {currentSelectedAccounts[0].email}
                        </span>
                      </div>
                      {getAccountIcon(currentSelectedAccounts[0].type)}
                    </>
                  ) : (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                      {currentSelectedAccounts.slice(0, 2).map(account => (
                        <Badge key={account.id} type="neutral" size="sm" className="flex max-w-32 items-center gap-1">
                          <Avatar collective={{ name: account.name, image: account.avatar }} radius={12} />
                          <span className="truncate text-xs">{account.name}</span>
                          <button
                            onClick={e => removeSelectedAccount(account.id, e)}
                            className="rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                      {currentSelectedAccounts.length > 2 && (
                        <Badge type="outline" size="sm" className="text-xs">
                          +{currentSelectedAccounts.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    <Avatar collective={{ name: selectedAccount!.name, image: selectedAccount!.avatar }} radius={20} />
                    <div className="flex min-w-0 flex-1 flex-col items-start">
                      <span className="truncate text-sm font-medium">{selectedAccount!.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{selectedAccount!.email}</span>
                    </div>
                    {getAccountIcon(selectedAccount!.type)}
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
                {multiSelect ? 'Select Accounts' : 'Select Account'}
                {multiSelect && selectedAccounts.length > 0 && (
                  <span className="ml-1 text-muted-foreground">({selectedAccounts.length})</span>
                )}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 flex-1 bg-transparent text-sm font-medium">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Vendor
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

              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 flex-1 bg-transparent text-sm font-medium">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite new user
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
            </div>

            <div ref={scrollRef} onScroll={handleScroll} className="max-h-60 space-y-1 overflow-y-auto">
              {currentSelectedAccounts.length > 0 && (
                <>
                  <div className="rounded bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">
                    Selected
                  </div>
                  {(searchQuery.trim() === '' ? currentSelectedAccounts : selectedAccountsInResults).map(account => (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-primary/20 bg-primary/10 p-2 text-sm transition-colors hover:bg-accent/50"
                    >
                      {multiSelect && <Checkbox checked={true} onChange={() => {}} className="pointer-events-none" />}

                      <Avatar collective={{ name: account.name, image: account.avatar }} radius={24} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-medium">{account.name}</p>
                          {getAccountIcon(account.type)}
                          {getStatusBadge(account.status)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                          {account.role && (
                            <Badge type="outline" size="xs" className="h-4 px-1 text-xs">
                              {account.role}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!multiSelect && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  ))}
                </>
              )}

              {(searchQuery.trim() === ''
                ? unselectedSuggestedAccounts.length > 0
                : unselectedAccountsInResults.length > 0) && (
                <div className="rounded bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">
                  {searchQuery.trim() === '' ? (
                    <>
                      {unselectedSuggestedAccounts.length} result{unselectedSuggestedAccounts.length !== 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      {unselectedAccountsInResults.length} result{unselectedAccountsInResults.length !== 1 ? 's' : ''}
                    </>
                  )}
                </div>
              )}

              {searchQuery.trim() === ''
                ? unselectedSuggestedAccounts.slice(0, displayedBaseResults).map(account => (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-accent/50"
                    >
                      {multiSelect && <Checkbox checked={false} onChange={() => {}} className="pointer-events-none" />}

                      <Avatar collective={{ name: account.name, image: account.avatar }} radius={24} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-medium">{account.name}</p>
                          {getAccountIcon(account.type)}
                          {getStatusBadge(account.status)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                          {account.role && (
                            <Badge type="outline" size="xs" className="h-4 px-1 text-xs">
                              {account.role}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!multiSelect && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  ))
                : unselectedAccountsInResults
                    .slice(0, displayedResults - selectedAccountsInResults.length)
                    .map(account => (
                      <div
                        key={account.id}
                        onClick={() => handleAccountSelect(account)}
                        className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-accent/50"
                      >
                        {multiSelect && (
                          <Checkbox
                            checked={isAccountSelected(account.id)}
                            onChange={() => {}}
                            className="pointer-events-none"
                          />
                        )}

                        <Avatar collective={{ name: account.name, image: account.avatar }} radius={24} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-medium">{account.name}</p>
                            {getAccountIcon(account.type)}
                            {getStatusBadge(account.status)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                            {account.role && (
                              <Badge type="outline" size="xs" className="h-4 px-1 text-xs">
                                {account.role}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {!multiSelect && isAccountSelected(account.id) && (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    ))}

              {isLoadingMore && (
                <div className="flex items-center justify-center py-2">
                  <div className="text-xs text-muted-foreground">Loading more...</div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
