/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Values that can be edited in Account's settings */
  AccountSettingsKey: any;
  DateString: any;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: any;
  /** A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/. */
  EmailAddress: any;
  IsoDateString: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
  /** A string that cannot be passed as an empty value */
  NonEmptyString: any;
  /** A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt. */
  URL: any;
};

/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type Account = {
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  /** Categories set by Open Collective to help moderation. */
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...) */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** The public id identifying the account (ie: 5v08jk63-w4g9nbpz-j7qmyder-p7ozax5g) */
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  /**
   * The internal database identifier of the collective (ie: 580)
   * @deprecated 2020-01-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** Get pending member invitations for this account */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf?: Maybe<MemberOfCollection>;
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this account can use to pay for Orders */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this account can use to get paid */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  /** The type of the account (BOT/COLLECTIVE/EVENT/ORGANIZATION/INDIVIDUAL/VENDOR) */
  type: AccountType;
  /** The time of last update */
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMemberInvitationsArgs = {
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** Account interface shared by all kind of accounts (Bot, Collective, Event, User, Organization) */
export type AccountVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};

export enum AccountCacheType {
  CLOUDFLARE = 'CLOUDFLARE',
  CONTRIBUTORS = 'CONTRIBUTORS',
  GRAPHQL_QUERIES = 'GRAPHQL_QUERIES'
}

/** A collection of "Accounts" */
export type AccountCollection = Collection & {
  __typename?: 'AccountCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Account>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum AccountFreezeAction {
  FREEZE = 'FREEZE',
  UNFREEZE = 'UNFREEZE'
}

/** Account orders filter (INCOMING or OUTGOING) */
export enum AccountOrdersFilter {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING'
}

/** Fields for the user permissions on an account */
export type AccountPermissions = {
  __typename?: 'AccountPermissions';
  /** Whether the current user can mark this order as expired */
  addFunds: Permission;
  id: Scalars['String'];
};

export type AccountReferenceInput = {
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /**
   * The internal id of the account (ie: 580)
   * @deprecated 2020-01-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId?: InputMaybe<Scalars['Int']>;
  /** The slug identifying the account (ie: babel for https://opencollective.com/babel) */
  slug?: InputMaybe<Scalars['String']>;
};

/** Stats for the Account */
export type AccountStats = {
  __typename?: 'AccountStats';
  /** @deprecated 2022-10-21: Use activeRecurringContributionsV2 while we migrate to better semantics. */
  activeRecurringContributions?: Maybe<Scalars['JSON']>;
  activeRecurringContributionsV2?: Maybe<Amount>;
  /** Amount of money in cents in the currency of the collective */
  balance: Amount;
  /**
   * Amount of money in cents in the currency of the collective currently available to spend
   * @deprecated 2022-12-13: Use balance + withBlockedFunds instead
   */
  balanceWithBlockedFunds: Amount;
  /**
   * The consolidated amount of all the events and projects combined.
   * @deprecated 2022-09-02: Use balance + includeChildren instead
   */
  consolidatedBalance: Amount;
  /** Return amount stats for contributions (default, and only for now: one-time vs recurring) */
  contributionsAmount?: Maybe<Array<Maybe<AmountStats>>>;
  /** Return amount time series for contributions (default, and only for now: one-time vs recurring) */
  contributionsAmountTimeSeries: TimeSeriesAmount;
  contributionsCount: Scalars['Int'];
  contributorsCount: Scalars['Int'];
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<AmountStats>>>;
  /** History of the expense tags used by this collective. */
  expensesTagsTimeSeries: TimeSeriesAmount;
  id?: Maybe<Scalars['String']>;
  /** Average amount spent per month based on the last 90 days */
  monthlySpending: Amount;
  /** Total amount received */
  totalAmountReceived: Amount;
  /** Total amount received time series */
  totalAmountReceivedTimeSeries: TimeSeriesAmount;
  /** Total amount spent */
  totalAmountSpent: Amount;
  /**
   * Total net amount received
   * @deprecated 2022-12-13: Use totalAmountReceived + net=true instead
   */
  totalNetAmountReceived: Amount;
  /**
   * Total net amount received time series
   * @deprecated 2022-12-13: Use totalAmountReceivedTimeSeries + net=true instead
   */
  totalNetAmountReceivedTimeSeries: TimeSeriesAmount;
  /** Total of paid expenses to the account, filter per expense type */
  totalPaidExpenses: Amount;
  yearlyBudget: Amount;
  yearlyBudgetManaged: Amount;
};


/** Stats for the Account */
export type AccountStatsActiveRecurringContributionsV2Args = {
  frequency?: ContributionFrequency;
};


/** Stats for the Account */
export type AccountStatsBalanceArgs = {
  currency?: InputMaybe<Currency>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  withBlockedFunds?: InputMaybe<Scalars['Boolean']>;
};


/** Stats for the Account */
export type AccountStatsContributionsAmountArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
};


/** Stats for the Account */
export type AccountStatsContributionsAmountTimeSeriesArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsContributionsCountArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
};


/** Stats for the Account */
export type AccountStatsContributorsCountArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
};


/** Stats for the Account */
export type AccountStatsExpensesTagsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
};


/** Stats for the Account */
export type AccountStatsExpensesTagsTimeSeriesArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsTotalAmountReceivedArgs = {
  currency?: InputMaybe<Currency>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  net?: InputMaybe<Scalars['Boolean']>;
  periodInMonths?: InputMaybe<Scalars['Int']>;
  useCache?: Scalars['Boolean'];
};


/** Stats for the Account */
export type AccountStatsTotalAmountReceivedTimeSeriesArgs = {
  currency?: InputMaybe<Currency>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  net?: InputMaybe<Scalars['Boolean']>;
  periodInMonths?: InputMaybe<Scalars['Int']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsTotalAmountSpentArgs = {
  currency?: InputMaybe<Currency>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  includeGiftCards?: InputMaybe<Scalars['Boolean']>;
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  net?: InputMaybe<Scalars['Boolean']>;
  periodInMonths?: InputMaybe<Scalars['Int']>;
};


/** Stats for the Account */
export type AccountStatsTotalNetAmountReceivedArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  periodInMonths?: InputMaybe<Scalars['Int']>;
};


/** Stats for the Account */
export type AccountStatsTotalNetAmountReceivedTimeSeriesArgs = {
  currency?: InputMaybe<Currency>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  includeChildren?: InputMaybe<Scalars['Boolean']>;
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  periodInMonths?: InputMaybe<Scalars['Int']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** Stats for the Account */
export type AccountStatsTotalPaidExpensesArgs = {
  currency?: InputMaybe<Currency>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  expenseType?: InputMaybe<Array<InputMaybe<ExpenseType>>>;
};

/** All account types */
export enum AccountType {
  BOT = 'BOT',
  COLLECTIVE = 'COLLECTIVE',
  EVENT = 'EVENT',
  FUND = 'FUND',
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
  PROJECT = 'PROJECT',
  VENDOR = 'VENDOR'
}

export type AccountUpdateInput = {
  currency?: InputMaybe<Currency>;
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id: Scalars['String'];
};

/** An account that can receive financial contributions */
export type AccountWithContributions = {
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
};


/** An account that can receive financial contributions */
export type AccountWithContributionsContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** An account that can receive financial contributions */
export type AccountWithContributionsTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** An account that can receive financial contributions */
export type AccountWithContributionsTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};

/** An account that can be hosted by a Host */
export type AccountWithHost = {
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Fees percentage that the platform takes for this collective */
  platformFeePercent?: Maybe<Scalars['Float']>;
};


/** An account that can be hosted by a Host */
export type AccountWithHostHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};

/** An account that has a parent account */
export type AccountWithParent = {
  /** The Account parenting this account */
  parent?: Maybe<Account>;
};

/** An activity describing something that happened on the platform */
export type Activity = {
  __typename?: 'Activity';
  /** The account targeted by this activity, if any */
  account?: Maybe<Account>;
  /** The date on which the ConnectedAccount was created */
  createdAt: Scalars['DateTime'];
  /** Data attached to this activity (if any) */
  data: Scalars['JSON'];
  /** The expense related to this activity, if any */
  expense?: Maybe<Expense>;
  /** The account that authored by this activity, if any */
  fromAccount?: Maybe<Account>;
  /** The host under which this activity happened, if any */
  host?: Maybe<Host>;
  /** Unique identifier for this activity */
  id: Scalars['String'];
  /** The person who triggered the action, if any */
  individual?: Maybe<Individual>;
  /** Specifies whether this is a system generated activity */
  isSystem: Scalars['Boolean'];
  /** The order related to this activity, if any */
  order?: Maybe<Order>;
  /** The transaction related to this activity, if any */
  transaction?: Maybe<Transaction>;
  /** The type of the activity */
  type: ActivityType;
};

export enum ActivityAndClassesType {
  ACTIVATED_COLLECTIVE_AS_HOST = 'ACTIVATED_COLLECTIVE_AS_HOST',
  ACTIVATED_COLLECTIVE_AS_INDEPENDENT = 'ACTIVATED_COLLECTIVE_AS_INDEPENDENT',
  ACTIVITIES_UPDATES = 'ACTIVITIES_UPDATES',
  ACTIVITY_ALL = 'ACTIVITY_ALL',
  ADDED_FUND_TO_ORG = 'ADDED_FUND_TO_ORG',
  BACKYOURSTACK_DISPATCH_CONFIRMED = 'BACKYOURSTACK_DISPATCH_CONFIRMED',
  COLLECTIVE = 'COLLECTIVE',
  COLLECTIVE_APPLY = 'COLLECTIVE_APPLY',
  COLLECTIVE_APPROVED = 'COLLECTIVE_APPROVED',
  COLLECTIVE_COMMENT_CREATED = 'COLLECTIVE_COMMENT_CREATED',
  COLLECTIVE_CONTACT = 'COLLECTIVE_CONTACT',
  COLLECTIVE_CONVERSATION_CREATED = 'COLLECTIVE_CONVERSATION_CREATED',
  COLLECTIVE_CORE_MEMBER_ADDED = 'COLLECTIVE_CORE_MEMBER_ADDED',
  COLLECTIVE_CORE_MEMBER_EDITED = 'COLLECTIVE_CORE_MEMBER_EDITED',
  COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED = 'COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED',
  COLLECTIVE_CORE_MEMBER_INVITED = 'COLLECTIVE_CORE_MEMBER_INVITED',
  COLLECTIVE_CORE_MEMBER_REMOVED = 'COLLECTIVE_CORE_MEMBER_REMOVED',
  COLLECTIVE_CREATED = 'COLLECTIVE_CREATED',
  COLLECTIVE_CREATED_GITHUB = 'COLLECTIVE_CREATED_GITHUB',
  COLLECTIVE_DELETED = 'COLLECTIVE_DELETED',
  COLLECTIVE_EDITED = 'COLLECTIVE_EDITED',
  COLLECTIVE_EXPENSE_APPROVED = 'COLLECTIVE_EXPENSE_APPROVED',
  COLLECTIVE_EXPENSE_CREATED = 'COLLECTIVE_EXPENSE_CREATED',
  COLLECTIVE_EXPENSE_DELETED = 'COLLECTIVE_EXPENSE_DELETED',
  COLLECTIVE_EXPENSE_ERROR = 'COLLECTIVE_EXPENSE_ERROR',
  COLLECTIVE_EXPENSE_INVITE_DRAFTED = 'COLLECTIVE_EXPENSE_INVITE_DRAFTED',
  COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE = 'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE',
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM = 'COLLECTIVE_EXPENSE_MARKED_AS_SPAM',
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID = 'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID',
  COLLECTIVE_EXPENSE_MISSING_RECEIPT = 'COLLECTIVE_EXPENSE_MISSING_RECEIPT',
  COLLECTIVE_EXPENSE_MOVED = 'COLLECTIVE_EXPENSE_MOVED',
  COLLECTIVE_EXPENSE_PAID = 'COLLECTIVE_EXPENSE_PAID',
  COLLECTIVE_EXPENSE_PROCESSING = 'COLLECTIVE_EXPENSE_PROCESSING',
  COLLECTIVE_EXPENSE_RECURRING_DRAFTED = 'COLLECTIVE_EXPENSE_RECURRING_DRAFTED',
  COLLECTIVE_EXPENSE_REJECTED = 'COLLECTIVE_EXPENSE_REJECTED',
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT = 'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT',
  COLLECTIVE_EXPENSE_UNAPPROVED = 'COLLECTIVE_EXPENSE_UNAPPROVED',
  COLLECTIVE_EXPENSE_UNSCHEDULED_FOR_PAYMENT = 'COLLECTIVE_EXPENSE_UNSCHEDULED_FOR_PAYMENT',
  COLLECTIVE_EXPENSE_UPDATED = 'COLLECTIVE_EXPENSE_UPDATED',
  COLLECTIVE_FROZEN = 'COLLECTIVE_FROZEN',
  COLLECTIVE_MEMBER_CREATED = 'COLLECTIVE_MEMBER_CREATED',
  COLLECTIVE_MEMBER_INVITED = 'COLLECTIVE_MEMBER_INVITED',
  COLLECTIVE_MONTHLY_REPORT = 'COLLECTIVE_MONTHLY_REPORT',
  COLLECTIVE_REJECTED = 'COLLECTIVE_REJECTED',
  COLLECTIVE_TRANSACTION_CREATED = 'COLLECTIVE_TRANSACTION_CREATED',
  COLLECTIVE_TRANSACTION_PAID = 'COLLECTIVE_TRANSACTION_PAID',
  COLLECTIVE_UNFROZEN = 'COLLECTIVE_UNFROZEN',
  COLLECTIVE_UNHOSTED = 'COLLECTIVE_UNHOSTED',
  COLLECTIVE_UPDATE_CREATED = 'COLLECTIVE_UPDATE_CREATED',
  COLLECTIVE_UPDATE_PUBLISHED = 'COLLECTIVE_UPDATE_PUBLISHED',
  COLLECTIVE_USER_ADDED = 'COLLECTIVE_USER_ADDED',
  COLLECTIVE_VIRTUAL_CARD_ADDED = 'COLLECTIVE_VIRTUAL_CARD_ADDED',
  COLLECTIVE_VIRTUAL_CARD_ASSIGNED = 'COLLECTIVE_VIRTUAL_CARD_ASSIGNED',
  COLLECTIVE_VIRTUAL_CARD_CREATED = 'COLLECTIVE_VIRTUAL_CARD_CREATED',
  COLLECTIVE_VIRTUAL_CARD_DELETED = 'COLLECTIVE_VIRTUAL_CARD_DELETED',
  COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS = 'COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS',
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED = 'COLLECTIVE_VIRTUAL_CARD_SUSPENDED',
  CONNECTED_ACCOUNT_CREATED = 'CONNECTED_ACCOUNT_CREATED',
  CONNECTED_ACCOUNT_ERROR = 'CONNECTED_ACCOUNT_ERROR',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  CONTRIBUTION_REJECTED = 'CONTRIBUTION_REJECTED',
  CONVERSATION_COMMENT_CREATED = 'CONVERSATION_COMMENT_CREATED',
  DEACTIVATED_COLLECTIVE_AS_HOST = 'DEACTIVATED_COLLECTIVE_AS_HOST',
  EXPENSES = 'EXPENSES',
  EXPENSE_COMMENT_CREATED = 'EXPENSE_COMMENT_CREATED',
  FUND_EVENTS = 'FUND_EVENTS',
  HOST_APPLICATION_CONTACT = 'HOST_APPLICATION_CONTACT',
  OAUTH_APPLICATION_AUTHORIZED = 'OAUTH_APPLICATION_AUTHORIZED',
  ORDERS_SUSPICIOUS = 'ORDERS_SUSPICIOUS',
  ORDER_CANCELED_ARCHIVED_COLLECTIVE = 'ORDER_CANCELED_ARCHIVED_COLLECTIVE',
  ORDER_PAYMENT_FAILED = 'ORDER_PAYMENT_FAILED',
  ORDER_PENDING = 'ORDER_PENDING',
  ORDER_PENDING_CONTRIBUTION_NEW = 'ORDER_PENDING_CONTRIBUTION_NEW',
  ORDER_PENDING_CONTRIBUTION_REMINDER = 'ORDER_PENDING_CONTRIBUTION_REMINDER',
  ORDER_PENDING_CREATED = 'ORDER_PENDING_CREATED',
  ORDER_PENDING_CRYPTO = 'ORDER_PENDING_CRYPTO',
  ORDER_PENDING_FOLLOWUP = 'ORDER_PENDING_FOLLOWUP',
  ORDER_PENDING_RECEIVED = 'ORDER_PENDING_RECEIVED',
  ORDER_PROCESSING = 'ORDER_PROCESSING',
  ORDER_THANKYOU = 'ORDER_THANKYOU',
  ORGANIZATION_COLLECTIVE_CREATED = 'ORGANIZATION_COLLECTIVE_CREATED',
  PAYMENT_CREDITCARD_CONFIRMATION = 'PAYMENT_CREDITCARD_CONFIRMATION',
  PAYMENT_CREDITCARD_EXPIRING = 'PAYMENT_CREDITCARD_EXPIRING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REPORTS = 'REPORTS',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  SUBSCRIPTION_CONFIRMED = 'SUBSCRIPTION_CONFIRMED',
  TAXFORM_REQUEST = 'TAXFORM_REQUEST',
  TICKET_CONFIRMED = 'TICKET_CONFIRMED',
  TWO_FACTOR_CODE_ADDED = 'TWO_FACTOR_CODE_ADDED',
  TWO_FACTOR_CODE_DELETED = 'TWO_FACTOR_CODE_DELETED',
  UPDATE_COMMENT_CREATED = 'UPDATE_COMMENT_CREATED',
  USER_CARD_CLAIMED = 'USER_CARD_CLAIMED',
  USER_CARD_INVITED = 'USER_CARD_INVITED',
  USER_CHANGE_EMAIL = 'USER_CHANGE_EMAIL',
  USER_CREATED = 'USER_CREATED',
  USER_NEW_TOKEN = 'USER_NEW_TOKEN',
  USER_PASSWORD_SET = 'USER_PASSWORD_SET',
  USER_PAYMENT_METHOD_CREATED = 'USER_PAYMENT_METHOD_CREATED',
  USER_RESET_PASSWORD = 'USER_RESET_PASSWORD',
  USER_SIGNIN = 'USER_SIGNIN',
  VIRTUAL_CARDS = 'VIRTUAL_CARDS',
  VIRTUAL_CARD_CHARGE_DECLINED = 'VIRTUAL_CARD_CHARGE_DECLINED',
  VIRTUAL_CARD_PURCHASE = 'VIRTUAL_CARD_PURCHASE',
  VIRTUAL_CARD_REQUESTED = 'VIRTUAL_CARD_REQUESTED',
  WEBHOOK_PAYPAL_RECEIVED = 'WEBHOOK_PAYPAL_RECEIVED',
  WEBHOOK_STRIPE_RECEIVED = 'WEBHOOK_STRIPE_RECEIVED'
}

/** All supported Activity channels we can broadcast to */
export enum ActivityChannel {
  email = 'email',
  gitter = 'gitter',
  slack = 'slack',
  twitter = 'twitter',
  webhook = 'webhook'
}

/** A collection of "Activities" */
export type ActivityCollection = Collection & {
  __typename?: 'ActivityCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Activity>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ActivitySubscription = {
  __typename?: 'ActivitySubscription';
  /** The account which this notification setting is applied to */
  account?: Maybe<Account>;
  /** Wheter this notification setting is active or not */
  active: Scalars['Boolean'];
  /** The channel this setting is notifying through */
  channel: ActivityChannel;
  createdAt: Scalars['DateTime'];
  /** Unique identifier for this notification setting */
  id: Scalars['String'];
  /** The user who defined the setting */
  individual: Individual;
  /** The type of Activity this setting is notifying about */
  type: Scalars['String'];
  /** If channel supports, this is the webhook URL we submit the notification to */
  webhookUrl?: Maybe<Scalars['String']>;
};

export enum ActivityType {
  ACTIVATED_COLLECTIVE_AS_HOST = 'ACTIVATED_COLLECTIVE_AS_HOST',
  ACTIVATED_COLLECTIVE_AS_INDEPENDENT = 'ACTIVATED_COLLECTIVE_AS_INDEPENDENT',
  ACTIVITY_ALL = 'ACTIVITY_ALL',
  ADDED_FUND_TO_ORG = 'ADDED_FUND_TO_ORG',
  BACKYOURSTACK_DISPATCH_CONFIRMED = 'BACKYOURSTACK_DISPATCH_CONFIRMED',
  COLLECTIVE_APPLY = 'COLLECTIVE_APPLY',
  COLLECTIVE_APPROVED = 'COLLECTIVE_APPROVED',
  COLLECTIVE_COMMENT_CREATED = 'COLLECTIVE_COMMENT_CREATED',
  COLLECTIVE_CONTACT = 'COLLECTIVE_CONTACT',
  COLLECTIVE_CONVERSATION_CREATED = 'COLLECTIVE_CONVERSATION_CREATED',
  COLLECTIVE_CORE_MEMBER_ADDED = 'COLLECTIVE_CORE_MEMBER_ADDED',
  COLLECTIVE_CORE_MEMBER_EDITED = 'COLLECTIVE_CORE_MEMBER_EDITED',
  COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED = 'COLLECTIVE_CORE_MEMBER_INVITATION_DECLINED',
  COLLECTIVE_CORE_MEMBER_INVITED = 'COLLECTIVE_CORE_MEMBER_INVITED',
  COLLECTIVE_CORE_MEMBER_REMOVED = 'COLLECTIVE_CORE_MEMBER_REMOVED',
  COLLECTIVE_CREATED = 'COLLECTIVE_CREATED',
  COLLECTIVE_CREATED_GITHUB = 'COLLECTIVE_CREATED_GITHUB',
  COLLECTIVE_DELETED = 'COLLECTIVE_DELETED',
  COLLECTIVE_EDITED = 'COLLECTIVE_EDITED',
  COLLECTIVE_EXPENSE_APPROVED = 'COLLECTIVE_EXPENSE_APPROVED',
  COLLECTIVE_EXPENSE_CREATED = 'COLLECTIVE_EXPENSE_CREATED',
  COLLECTIVE_EXPENSE_DELETED = 'COLLECTIVE_EXPENSE_DELETED',
  COLLECTIVE_EXPENSE_ERROR = 'COLLECTIVE_EXPENSE_ERROR',
  COLLECTIVE_EXPENSE_INVITE_DRAFTED = 'COLLECTIVE_EXPENSE_INVITE_DRAFTED',
  COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE = 'COLLECTIVE_EXPENSE_MARKED_AS_INCOMPLETE',
  COLLECTIVE_EXPENSE_MARKED_AS_SPAM = 'COLLECTIVE_EXPENSE_MARKED_AS_SPAM',
  COLLECTIVE_EXPENSE_MARKED_AS_UNPAID = 'COLLECTIVE_EXPENSE_MARKED_AS_UNPAID',
  COLLECTIVE_EXPENSE_MISSING_RECEIPT = 'COLLECTIVE_EXPENSE_MISSING_RECEIPT',
  COLLECTIVE_EXPENSE_MOVED = 'COLLECTIVE_EXPENSE_MOVED',
  COLLECTIVE_EXPENSE_PAID = 'COLLECTIVE_EXPENSE_PAID',
  COLLECTIVE_EXPENSE_PROCESSING = 'COLLECTIVE_EXPENSE_PROCESSING',
  COLLECTIVE_EXPENSE_RECURRING_DRAFTED = 'COLLECTIVE_EXPENSE_RECURRING_DRAFTED',
  COLLECTIVE_EXPENSE_REJECTED = 'COLLECTIVE_EXPENSE_REJECTED',
  COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT = 'COLLECTIVE_EXPENSE_SCHEDULED_FOR_PAYMENT',
  COLLECTIVE_EXPENSE_UNAPPROVED = 'COLLECTIVE_EXPENSE_UNAPPROVED',
  COLLECTIVE_EXPENSE_UNSCHEDULED_FOR_PAYMENT = 'COLLECTIVE_EXPENSE_UNSCHEDULED_FOR_PAYMENT',
  COLLECTIVE_EXPENSE_UPDATED = 'COLLECTIVE_EXPENSE_UPDATED',
  COLLECTIVE_FROZEN = 'COLLECTIVE_FROZEN',
  COLLECTIVE_MEMBER_CREATED = 'COLLECTIVE_MEMBER_CREATED',
  COLLECTIVE_MEMBER_INVITED = 'COLLECTIVE_MEMBER_INVITED',
  COLLECTIVE_MONTHLY_REPORT = 'COLLECTIVE_MONTHLY_REPORT',
  COLLECTIVE_REJECTED = 'COLLECTIVE_REJECTED',
  COLLECTIVE_TRANSACTION_CREATED = 'COLLECTIVE_TRANSACTION_CREATED',
  COLLECTIVE_TRANSACTION_PAID = 'COLLECTIVE_TRANSACTION_PAID',
  COLLECTIVE_UNFROZEN = 'COLLECTIVE_UNFROZEN',
  COLLECTIVE_UNHOSTED = 'COLLECTIVE_UNHOSTED',
  COLLECTIVE_UPDATE_CREATED = 'COLLECTIVE_UPDATE_CREATED',
  COLLECTIVE_UPDATE_PUBLISHED = 'COLLECTIVE_UPDATE_PUBLISHED',
  COLLECTIVE_USER_ADDED = 'COLLECTIVE_USER_ADDED',
  COLLECTIVE_VIRTUAL_CARD_ADDED = 'COLLECTIVE_VIRTUAL_CARD_ADDED',
  COLLECTIVE_VIRTUAL_CARD_ASSIGNED = 'COLLECTIVE_VIRTUAL_CARD_ASSIGNED',
  COLLECTIVE_VIRTUAL_CARD_CREATED = 'COLLECTIVE_VIRTUAL_CARD_CREATED',
  COLLECTIVE_VIRTUAL_CARD_DELETED = 'COLLECTIVE_VIRTUAL_CARD_DELETED',
  COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS = 'COLLECTIVE_VIRTUAL_CARD_MISSING_RECEIPTS',
  COLLECTIVE_VIRTUAL_CARD_SUSPENDED = 'COLLECTIVE_VIRTUAL_CARD_SUSPENDED',
  CONNECTED_ACCOUNT_CREATED = 'CONNECTED_ACCOUNT_CREATED',
  CONNECTED_ACCOUNT_ERROR = 'CONNECTED_ACCOUNT_ERROR',
  CONTRIBUTION_REJECTED = 'CONTRIBUTION_REJECTED',
  CONVERSATION_COMMENT_CREATED = 'CONVERSATION_COMMENT_CREATED',
  DEACTIVATED_COLLECTIVE_AS_HOST = 'DEACTIVATED_COLLECTIVE_AS_HOST',
  EXPENSE_COMMENT_CREATED = 'EXPENSE_COMMENT_CREATED',
  HOST_APPLICATION_CONTACT = 'HOST_APPLICATION_CONTACT',
  OAUTH_APPLICATION_AUTHORIZED = 'OAUTH_APPLICATION_AUTHORIZED',
  ORDERS_SUSPICIOUS = 'ORDERS_SUSPICIOUS',
  ORDER_CANCELED_ARCHIVED_COLLECTIVE = 'ORDER_CANCELED_ARCHIVED_COLLECTIVE',
  ORDER_PAYMENT_FAILED = 'ORDER_PAYMENT_FAILED',
  ORDER_PENDING = 'ORDER_PENDING',
  ORDER_PENDING_CONTRIBUTION_NEW = 'ORDER_PENDING_CONTRIBUTION_NEW',
  ORDER_PENDING_CONTRIBUTION_REMINDER = 'ORDER_PENDING_CONTRIBUTION_REMINDER',
  ORDER_PENDING_CREATED = 'ORDER_PENDING_CREATED',
  ORDER_PENDING_CRYPTO = 'ORDER_PENDING_CRYPTO',
  ORDER_PENDING_FOLLOWUP = 'ORDER_PENDING_FOLLOWUP',
  ORDER_PENDING_RECEIVED = 'ORDER_PENDING_RECEIVED',
  ORDER_PROCESSING = 'ORDER_PROCESSING',
  ORDER_THANKYOU = 'ORDER_THANKYOU',
  ORGANIZATION_COLLECTIVE_CREATED = 'ORGANIZATION_COLLECTIVE_CREATED',
  PAYMENT_CREDITCARD_CONFIRMATION = 'PAYMENT_CREDITCARD_CONFIRMATION',
  PAYMENT_CREDITCARD_EXPIRING = 'PAYMENT_CREDITCARD_EXPIRING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  SUBSCRIPTION_CONFIRMED = 'SUBSCRIPTION_CONFIRMED',
  TAXFORM_REQUEST = 'TAXFORM_REQUEST',
  TICKET_CONFIRMED = 'TICKET_CONFIRMED',
  TWO_FACTOR_CODE_ADDED = 'TWO_FACTOR_CODE_ADDED',
  TWO_FACTOR_CODE_DELETED = 'TWO_FACTOR_CODE_DELETED',
  UPDATE_COMMENT_CREATED = 'UPDATE_COMMENT_CREATED',
  USER_CARD_CLAIMED = 'USER_CARD_CLAIMED',
  USER_CARD_INVITED = 'USER_CARD_INVITED',
  USER_CHANGE_EMAIL = 'USER_CHANGE_EMAIL',
  USER_CREATED = 'USER_CREATED',
  USER_NEW_TOKEN = 'USER_NEW_TOKEN',
  USER_PASSWORD_SET = 'USER_PASSWORD_SET',
  USER_PAYMENT_METHOD_CREATED = 'USER_PAYMENT_METHOD_CREATED',
  USER_RESET_PASSWORD = 'USER_RESET_PASSWORD',
  USER_SIGNIN = 'USER_SIGNIN',
  VIRTUAL_CARD_CHARGE_DECLINED = 'VIRTUAL_CARD_CHARGE_DECLINED',
  VIRTUAL_CARD_PURCHASE = 'VIRTUAL_CARD_PURCHASE',
  VIRTUAL_CARD_REQUESTED = 'VIRTUAL_CARD_REQUESTED',
  WEBHOOK_PAYPAL_RECEIVED = 'WEBHOOK_PAYPAL_RECEIVED',
  WEBHOOK_STRIPE_RECEIVED = 'WEBHOOK_STRIPE_RECEIVED'
}

/** Response for the addTwoFactorAuthTokenToIndividual mutation */
export type AddTwoFactorAuthTokenToIndividualResponse = {
  __typename?: 'AddTwoFactorAuthTokenToIndividualResponse';
  /** The Individual that the 2FA has been enabled for */
  account: Individual;
  /** The recovery codes for the Individual to write down */
  recoveryCodes?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** A financial amount. */
export type Amount = {
  __typename?: 'Amount';
  currency?: Maybe<Currency>;
  /** If the amount was generated from a currency conversion, this field contains details about the conversion */
  exchangeRate?: Maybe<CurrencyExchangeRate>;
  value?: Maybe<Scalars['Float']>;
  valueInCents?: Maybe<Scalars['Float']>;
};

/** Input type for an amount with the value and currency */
export type AmountInput = {
  /** The currency string */
  currency?: InputMaybe<Currency>;
  /** The value in plain */
  value?: InputMaybe<Scalars['Float']>;
  /** The value in cents */
  valueInCents?: InputMaybe<Scalars['Int']>;
};

/** Statistics aith amounts */
export type AmountStats = {
  __typename?: 'AmountStats';
  /** Total amount for this label */
  amount: Amount;
  /** Number of entries for this label */
  count?: Maybe<Scalars['Int']>;
  /** Name/Label for the amount */
  label: Scalars['String'];
};

/** An OAuth application. */
export type Application = {
  __typename?: 'Application';
  account: Account;
  /** @deprecated 2022-06-16: This Application object will only be used for OAuth tokens. Use PersonalToken for user tokens */
  apiKey?: Maybe<Scalars['String']>;
  clientId?: Maybe<Scalars['String']>;
  clientSecret?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  oAuthAuthorization?: Maybe<OAuthAuthorization>;
  redirectUri?: Maybe<Scalars['URL']>;
  /** @deprecated 2022-06-16: This Application object will only be used for OAuth tokens. Use PersonalToken for user tokens */
  type?: Maybe<ApplicationType>;
};

/** Input type for Application */
export type ApplicationCreateInput = {
  /** The account to use as the owner of the application. Defaults to currently logged in user. */
  account?: InputMaybe<AccountReferenceInput>;
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  redirectUri?: InputMaybe<Scalars['URL']>;
  type?: ApplicationType;
};

export type ApplicationReferenceInput = {
  /** The clientId for the application. */
  clientId?: InputMaybe<Scalars['String']>;
  /** The public id identifying the application (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the application (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All application types */
export enum ApplicationType {
  API_KEY = 'API_KEY',
  OAUTH = 'OAUTH'
}

/** Input type for Application */
export type ApplicationUpdateInput = {
  /** The clientId for the application. */
  clientId?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  /** The public id identifying the application (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the application (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  name?: InputMaybe<Scalars['String']>;
  redirectUri?: InputMaybe<Scalars['URL']>;
};

export type BanAccountResponse = {
  __typename?: 'BanAccountResponse';
  /** The accounts impacted by the mutation */
  accounts: Array<Account>;
  /** Whether the accounts can be banned */
  isAllowed: Scalars['Boolean'];
  /** A summary of the changes */
  message?: Maybe<Scalars['String']>;
};

/** This represents a Bot account */
export type Bot = Account & {
  __typename?: 'Bot';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Bot account */
export type BotBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Bot account */
export type BotChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Bot account */
export type BotMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Bot account */
export type BotMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Bot account */
export type BotOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Bot account */
export type BotTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Bot account */
export type BotUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Bot account */
export type BotVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Bot account */
export type BotWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type Collective_Minimum_Admins = {
  __typename?: 'COLLECTIVE_MINIMUM_ADMINS';
  applies?: Maybe<PolicyApplication>;
  freeze?: Maybe<Scalars['Boolean']>;
  numberOfAdmins?: Maybe<Scalars['Int']>;
};

/** Captcha related information */
export type CaptchaInput = {
  /** Catpcha provider */
  provider: CaptchaProvider;
  /** Captcha validation token */
  token: Scalars['String'];
};

/** Implemented Captcha Providers */
export enum CaptchaProvider {
  HCAPTCHA = 'HCAPTCHA',
  RECAPTCHA = 'RECAPTCHA'
}

/** Input to order results chronologically */
export type ChronologicalOrderInput = {
  /** Ordering direction. */
  direction?: OrderDirection;
  /** Field to chronologically order by. */
  field?: DateTimeField;
};

/** Collection interface shared by all collection types */
export type Collection = {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** This represents a Collective account */
export type Collective = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Collective';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Collective account */
export type CollectiveBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Collective account */
export type CollectiveChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents a Collective account */
export type CollectiveImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Collective account */
export type CollectiveMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Collective account */
export type CollectiveOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectivePaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Collective account */
export type CollectiveTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents a Collective account */
export type CollectiveTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Collective account */
export type CollectiveUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Collective account */
export type CollectiveVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Collective account */
export type CollectiveWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type CollectiveCreateInput = {
  description: Scalars['String'];
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: InputMaybe<Scalars['String']>;
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export enum CollectiveFeatureStatus {
  /** The feature is enabled and is actively used */
  ACTIVE = 'ACTIVE',
  /** The feature is enabled, but there is no data for it */
  AVAILABLE = 'AVAILABLE',
  /** The feature is disabled, but can be enabled by an admin */
  DISABLED = 'DISABLED',
  /** The feature is disabled and cannot be activated for this account */
  UNSUPPORTED = 'UNSUPPORTED'
}

/** Describes the features enabled and available for this account */
export type CollectiveFeatures = {
  __typename?: 'CollectiveFeatures';
  ABOUT?: Maybe<CollectiveFeatureStatus>;
  ALIPAY?: Maybe<CollectiveFeatureStatus>;
  ALL?: Maybe<CollectiveFeatureStatus>;
  COLLECTIVE_GOALS?: Maybe<CollectiveFeatureStatus>;
  CONNECTED_ACCOUNTS?: Maybe<CollectiveFeatureStatus>;
  CONTACT_COLLECTIVE?: Maybe<CollectiveFeatureStatus>;
  CONTACT_FORM?: Maybe<CollectiveFeatureStatus>;
  CONVERSATIONS?: Maybe<CollectiveFeatureStatus>;
  CREATE_COLLECTIVE?: Maybe<CollectiveFeatureStatus>;
  CROSS_CURRENCY_MANUAL_TRANSACTIONS?: Maybe<CollectiveFeatureStatus>;
  EMAIL_NOTIFICATIONS_PANEL?: Maybe<CollectiveFeatureStatus>;
  EMIT_GIFT_CARDS?: Maybe<CollectiveFeatureStatus>;
  EVENTS?: Maybe<CollectiveFeatureStatus>;
  HOST_DASHBOARD?: Maybe<CollectiveFeatureStatus>;
  MULTI_CURRENCY_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  ORDER?: Maybe<CollectiveFeatureStatus>;
  PAYPAL_DONATIONS?: Maybe<CollectiveFeatureStatus>;
  PAYPAL_PAYOUTS?: Maybe<CollectiveFeatureStatus>;
  PROJECTS?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_FINANCIAL_CONTRIBUTIONS?: Maybe<CollectiveFeatureStatus>;
  RECEIVE_HOST_APPLICATIONS?: Maybe<CollectiveFeatureStatus>;
  RECURRING_CONTRIBUTIONS?: Maybe<CollectiveFeatureStatus>;
  REQUEST_VIRTUAL_CARDS?: Maybe<CollectiveFeatureStatus>;
  STRIPE_PAYMENT_INTENT?: Maybe<CollectiveFeatureStatus>;
  TEAM?: Maybe<CollectiveFeatureStatus>;
  TOP_FINANCIAL_CONTRIBUTORS?: Maybe<CollectiveFeatureStatus>;
  TRANSACTIONS?: Maybe<CollectiveFeatureStatus>;
  TRANSFERWISE?: Maybe<CollectiveFeatureStatus>;
  UPDATES?: Maybe<CollectiveFeatureStatus>;
  USE_EXPENSES?: Maybe<CollectiveFeatureStatus>;
  USE_PAYMENT_METHODS?: Maybe<CollectiveFeatureStatus>;
  VIRTUAL_CARDS?: Maybe<CollectiveFeatureStatus>;
  /** The id of the account */
  id: Scalars['String'];
};

/** This represents an Comment */
export type Comment = {
  __typename?: 'Comment';
  account?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  fromAccount?: Maybe<Account>;
  html?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** Returns a map of reactions counts for this comment */
  reactions?: Maybe<Scalars['JSON']>;
  /** Returns the list of reactions added to this comment by logged in user */
  userReactions?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** A collection of "Comments" */
export type CommentCollection = Collection & {
  __typename?: 'CommentCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Comment>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input to create a comment. You can only specify one entity type: expense, conversation or update */
export type CommentCreateInput = {
  /** @deprecated 2022-08-26: Please use "conversation" */
  ConversationId?: InputMaybe<Scalars['String']>;
  conversation?: InputMaybe<ConversationReferenceInput>;
  /** If your comment is linked to an expense, set it here */
  expense?: InputMaybe<ExpenseReferenceInput>;
  html?: InputMaybe<Scalars['String']>;
  update?: InputMaybe<UpdateReferenceInput>;
};

export type CommentReferenceInput = {
  /** The public id identifying the comment */
  id?: InputMaybe<Scalars['String']>;
};

export type CommentUpdateInput = {
  html?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
};

/** Response for the confirmGuestAccount mutation */
export type ConfirmGuestAccountResponse = {
  __typename?: 'ConfirmGuestAccountResponse';
  /** A token that can be used to sign in */
  accessToken: Scalars['String'];
  /** The validated account */
  account: Account;
};

/** This represents a Connected Account */
export type ConnectedAccount = {
  __typename?: 'ConnectedAccount';
  /** The date on which the ConnectedAccount was created */
  createdAt: Scalars['DateTime'];
  /** Unique identifier for this connected account */
  id: Scalars['String'];
  /**
   * The internal database identifier of the Connected Account (ie: 580)
   * @deprecated 2020-05-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId?: Maybe<Scalars['Int']>;
  service: ConnectedAccountService;
  settings?: Maybe<Scalars['JSON']>;
  /** The date on which the ConnectedAccount was last updated */
  updatedAt: Scalars['DateTime'];
};

export type ConnectedAccountCreateInput = {
  /** Optional Client ID for the token or secret */
  clientId?: InputMaybe<Scalars['String']>;
  /** Private data related to the connected account */
  data?: InputMaybe<Scalars['JSON']>;
  /** Refresh token for the connected account */
  refreshToken?: InputMaybe<Scalars['String']>;
  /** Service which the connected account belongs to */
  service?: InputMaybe<ConnectedAccountService>;
  /** Public data related to the connected account */
  settings?: InputMaybe<Scalars['JSON']>;
  /** Secret token used to call service */
  token?: InputMaybe<Scalars['String']>;
  /** Optional username for the connected account */
  username?: InputMaybe<Scalars['String']>;
};

export type ConnectedAccountReferenceInput = {
  /** The public id identifying the connected account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the account (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All supported services a user can connect with */
export enum ConnectedAccountService {
  github = 'github',
  /** @deprecated Not using this service anymore */
  meetup = 'meetup',
  paypal = 'paypal',
  privacy = 'privacy',
  stripe = 'stripe',
  stripe_customer = 'stripe_customer',
  thegivingblock = 'thegivingblock',
  transferwise = 'transferwise',
  twitter = 'twitter'
}

export enum ContributionFrequency {
  MONTHLY = 'MONTHLY',
  ONETIME = 'ONETIME',
  YEARLY = 'YEARLY'
}

/** Contribution statistics related to the given accounts */
export type ContributionStats = {
  __typename?: 'ContributionStats';
  /** The total number of contributions */
  contributionsCount: Scalars['Int'];
  /** The daily average income */
  dailyAverageIncomeAmount: Amount;
  /** Number of one time contributions */
  oneTimeContributionsCount: Scalars['Int'];
  /** Number of recurring contributions */
  recurringContributionsCount: Scalars['Int'];
};

/**
 *
 *     A person or an entity that contributes financially or by any other mean to the mission
 *     of the collective. While "Member" is dedicated to permissions, this type is meant
 *     to surface all the public contributors.
 *
 */
export type Contributor = {
  __typename?: 'Contributor';
  /** If the contributor has a page on Open Collective, this is the slug to link to it */
  collectiveSlug?: Maybe<Scalars['String']>;
  /** Description of how the member contribute. Will usually be a tier name, or "design" or "code". */
  description?: Maybe<Scalars['String']>;
  /** A unique identifier for this member */
  id: Scalars['String'];
  /** Contributor avatar or logo */
  image?: Maybe<Scalars['String']>;
  /** True if the contributor is a collective admin */
  isAdmin: Scalars['Boolean'];
  /** True if the contributor is a financial contributor */
  isBacker: Scalars['Boolean'];
  /** True if the contributor is a core contributor */
  isCore: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  /** Name of the contributor */
  name: Scalars['String'];
  /** A public message from contributors to describe their contributions */
  publicMessage?: Maybe<Scalars['String']>;
  /** All the roles for a given contributor */
  roles?: Maybe<Array<Maybe<ContributorRole>>>;
  /** Member join date */
  since: Scalars['DateTime'];
  /** How much money the user has contributed for this (in cents, using collective currency) */
  totalAmountDonated: Scalars['Int'];
  /** Whether the contributor is an individual, an organization... */
  type: Scalars['String'];
};


/**
 *
 *     A person or an entity that contributes financially or by any other mean to the mission
 *     of the collective. While "Member" is dedicated to permissions, this type is meant
 *     to surface all the public contributors.
 *
 */
export type ContributorImageArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};

/** A collection of "Contributor" */
export type ContributorCollection = Collection & {
  __typename?: 'ContributorCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Contributor>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Possible roles for a contributor. Extends `Member.Role`. */
export enum ContributorRole {
  ACCOUNTANT = 'ACCOUNTANT',
  ADMIN = 'ADMIN',
  ATTENDEE = 'ATTENDEE',
  BACKER = 'BACKER',
  CONNECTED_COLLECTIVE = 'CONNECTED_COLLECTIVE',
  CONTRIBUTOR = 'CONTRIBUTOR',
  FOLLOWER = 'FOLLOWER',
  HOST = 'HOST',
  MEMBER = 'MEMBER'
}

/** A conversation thread */
export type Conversation = {
  __typename?: 'Conversation';
  account?: Maybe<Account>;
  /** The root comment / starter for this conversation */
  body?: Maybe<Comment>;
  /** List the comments for this conversation. Not backed by a loader, don't use this in lists. */
  comments: CommentCollection;
  createdAt: Scalars['DateTime'];
  followers: AccountCollection;
  fromAccount?: Maybe<Account>;
  id: Scalars['String'];
  slug: Scalars['String'];
  stats?: Maybe<ConversationStats>;
  summary: Scalars['String'];
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};


/** A conversation thread */
export type ConversationCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** A conversation thread */
export type ConversationFollowersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** A collection of "Conversations" */
export type ConversationCollection = Collection & {
  __typename?: 'ConversationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Conversation>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ConversationReferenceInput = {
  /** The public id identifying the conversation */
  id?: InputMaybe<Scalars['String']>;
  legacyId?: InputMaybe<Scalars['Int']>;
};

export type ConversationStats = {
  __typename?: 'ConversationStats';
  /** Total number of comments for this conversation */
  commentsCount?: Maybe<Scalars['Int']>;
  id: Scalars['String'];
};

/** Two-letters country code following ISO3166_1 */
export enum CountryIso {
  /** Andorra */
  AD = 'AD',
  /** The United Arab Emirates */
  AE = 'AE',
  /** Afghanistan */
  AF = 'AF',
  /** Antigua and Barbuda */
  AG = 'AG',
  /** Anguilla */
  AI = 'AI',
  /** Albania */
  AL = 'AL',
  /** Armenia */
  AM = 'AM',
  /** Netherlands Antilles */
  AN = 'AN',
  /** Angola */
  AO = 'AO',
  /** Antarctica */
  AQ = 'AQ',
  /** Argentina */
  AR = 'AR',
  /** American Samoa */
  AS = 'AS',
  /** Austria */
  AT = 'AT',
  /** Australia */
  AU = 'AU',
  /** Aruba */
  AW = 'AW',
  /** Åland Islands */
  AX = 'AX',
  /** Azerbaijan */
  AZ = 'AZ',
  /** Bosnia and Herzegovina */
  BA = 'BA',
  /** Barbados */
  BB = 'BB',
  /** Bangladesh */
  BD = 'BD',
  /** Belgium */
  BE = 'BE',
  /** Burkina */
  BF = 'BF',
  /** Bulgaria */
  BG = 'BG',
  /** Bahrain */
  BH = 'BH',
  /** Burundi */
  BI = 'BI',
  /** Benin */
  BJ = 'BJ',
  /** Saint Barthélemy */
  BL = 'BL',
  /** Bermuda */
  BM = 'BM',
  /** Brunei */
  BN = 'BN',
  /** Bolivia */
  BO = 'BO',
  /** Brazil */
  BR = 'BR',
  /** The Bahamas */
  BS = 'BS',
  /** Bhutan */
  BT = 'BT',
  /** Bouvet Island */
  BV = 'BV',
  /** Botswana */
  BW = 'BW',
  /** Belarus */
  BY = 'BY',
  /** Belize */
  BZ = 'BZ',
  /** Canada */
  CA = 'CA',
  /** Cocos Islands */
  CC = 'CC',
  /** The Democratic Republic of the Congo */
  CD = 'CD',
  /** The Central African Republic */
  CF = 'CF',
  /** The Congo */
  CG = 'CG',
  /** Switzerland */
  CH = 'CH',
  /** Côte d'Ivoire */
  CI = 'CI',
  /** Cook Islands */
  CK = 'CK',
  /** Chile */
  CL = 'CL',
  /** Cameroon */
  CM = 'CM',
  /** China */
  CN = 'CN',
  /** Colombia */
  CO = 'CO',
  /** Costa Rica */
  CR = 'CR',
  /** Cuba */
  CU = 'CU',
  /** Cape Verde */
  CV = 'CV',
  /** Christmas Island */
  CX = 'CX',
  /** Cyprus */
  CY = 'CY',
  /** The Czech Republic */
  CZ = 'CZ',
  /** Germany */
  DE = 'DE',
  /** Djibouti */
  DJ = 'DJ',
  /** Denmark */
  DK = 'DK',
  /** Dominica */
  DM = 'DM',
  /** The Dominican Republic */
  DO = 'DO',
  /** Algeria */
  DZ = 'DZ',
  /** Ecuador */
  EC = 'EC',
  /** Estonia */
  EE = 'EE',
  /** Egypt */
  EG = 'EG',
  /** Western Sahara */
  EH = 'EH',
  /** Eritrea */
  ER = 'ER',
  /** Spain */
  ES = 'ES',
  /** Ethiopia */
  ET = 'ET',
  /** Finland */
  FI = 'FI',
  /** Fiji */
  FJ = 'FJ',
  /** Falkland Islands */
  FK = 'FK',
  /** Micronesia */
  FM = 'FM',
  /** Faroe Islands */
  FO = 'FO',
  /** France */
  FR = 'FR',
  /** Gabon */
  GA = 'GA',
  /** The United Kingdom */
  GB = 'GB',
  /** Grenada */
  GD = 'GD',
  /** Georgia */
  GE = 'GE',
  /** French Guiana */
  GF = 'GF',
  /** Guernsey */
  GG = 'GG',
  /** Ghana */
  GH = 'GH',
  /** Gibraltar */
  GI = 'GI',
  /** Greenland */
  GL = 'GL',
  /** The Gambia */
  GM = 'GM',
  /** Guinea */
  GN = 'GN',
  /** Guadeloupe */
  GP = 'GP',
  /** Equatorial Guinea */
  GQ = 'GQ',
  /** Greece */
  GR = 'GR',
  /** South Georgia and The South Sandwich Islands */
  GS = 'GS',
  /** Guatemala */
  GT = 'GT',
  /** Guam */
  GU = 'GU',
  /** Guinea-Bissau */
  GW = 'GW',
  /** Guyana */
  GY = 'GY',
  /** Hong Kong */
  HK = 'HK',
  /** Heard Island and McDonald Islands */
  HM = 'HM',
  /** Honduras */
  HN = 'HN',
  /** Croatia */
  HR = 'HR',
  /** Haiti */
  HT = 'HT',
  /** Hungary */
  HU = 'HU',
  /** Indonesia */
  ID = 'ID',
  /** Ireland */
  IE = 'IE',
  /** Israel */
  IL = 'IL',
  /** Isle of Man */
  IM = 'IM',
  /** India */
  IN = 'IN',
  /** The British Indian Ocean Territory */
  IO = 'IO',
  /** Iraq */
  IQ = 'IQ',
  /** Iran */
  IR = 'IR',
  /** Iceland */
  IS = 'IS',
  /** Italy */
  IT = 'IT',
  /** Jersey */
  JE = 'JE',
  /** Jamaica */
  JM = 'JM',
  /** Jordan */
  JO = 'JO',
  /** Japan */
  JP = 'JP',
  /** Kenya */
  KE = 'KE',
  /** Kyrgyzstan */
  KG = 'KG',
  /** Cambodia */
  KH = 'KH',
  /** Kiribati */
  KI = 'KI',
  /** The Comoros */
  KM = 'KM',
  /** Saint Kitts and Nevis */
  KN = 'KN',
  /** The Democratic People's Republic of Korea */
  KP = 'KP',
  /** The Republic of Korea */
  KR = 'KR',
  /** Kuwait */
  KW = 'KW',
  /** Cayman Islands */
  KY = 'KY',
  /** Kazakhstan */
  KZ = 'KZ',
  /** Laos */
  LA = 'LA',
  /** Lebanon */
  LB = 'LB',
  /** Saint Lucia */
  LC = 'LC',
  /** Liechtenstein */
  LI = 'LI',
  /** Sri Lanka */
  LK = 'LK',
  /** Liberia */
  LR = 'LR',
  /** Lesotho */
  LS = 'LS',
  /** Lithuania */
  LT = 'LT',
  /** Luxembourg */
  LU = 'LU',
  /** Latvia */
  LV = 'LV',
  /** Libya */
  LY = 'LY',
  /** Morocco */
  MA = 'MA',
  /** Monaco */
  MC = 'MC',
  /** Moldova */
  MD = 'MD',
  /** Montenegro */
  ME = 'ME',
  /** Saint Martin */
  MF = 'MF',
  /** Madagascar */
  MG = 'MG',
  /** The Marshall Islands */
  MH = 'MH',
  /** Macedonia */
  MK = 'MK',
  /** Mali */
  ML = 'ML',
  /** Myanmar */
  MM = 'MM',
  /** Mongolia */
  MN = 'MN',
  /** Macao */
  MO = 'MO',
  /** Northern Mariana Islands */
  MP = 'MP',
  /** Martinique */
  MQ = 'MQ',
  /** Mauritania */
  MR = 'MR',
  /** Montserrat */
  MS = 'MS',
  /** Malta */
  MT = 'MT',
  /** Mauritius */
  MU = 'MU',
  /** Maldives */
  MV = 'MV',
  /** Malawi */
  MW = 'MW',
  /** Mexico */
  MX = 'MX',
  /** Malaysia */
  MY = 'MY',
  /** Mozambique */
  MZ = 'MZ',
  /** Namibia */
  NA = 'NA',
  /** New Caledonia */
  NC = 'NC',
  /** The Niger */
  NE = 'NE',
  /** Norfolk Island */
  NF = 'NF',
  /** Nigeria */
  NG = 'NG',
  /** Nicaragua */
  NI = 'NI',
  /** The Netherlands */
  NL = 'NL',
  /** Norway */
  NO = 'NO',
  /** Nepal */
  NP = 'NP',
  /** Nauru */
  NR = 'NR',
  /** Niue */
  NU = 'NU',
  /** New Zealand */
  NZ = 'NZ',
  /** Oman */
  OM = 'OM',
  /** Panama */
  PA = 'PA',
  /** Peru */
  PE = 'PE',
  /** French Polynesia */
  PF = 'PF',
  /** Papua New Guinea */
  PG = 'PG',
  /** The Philippines */
  PH = 'PH',
  /** Pakistan */
  PK = 'PK',
  /** Poland */
  PL = 'PL',
  /** Saint Pierre and Miquelon */
  PM = 'PM',
  /** Pitcairn */
  PN = 'PN',
  /** Puerto Rico */
  PR = 'PR',
  /** The Occupied Palestinian Territory */
  PS = 'PS',
  /** Portugal */
  PT = 'PT',
  /** Palau */
  PW = 'PW',
  /** Paraguay */
  PY = 'PY',
  /** Qatar */
  QA = 'QA',
  /** Réunion */
  RE = 'RE',
  /** Romania */
  RO = 'RO',
  /** Serbia */
  RS = 'RS',
  /** Russia */
  RU = 'RU',
  /** Rwanda */
  RW = 'RW',
  /** Saudi Arabia */
  SA = 'SA',
  /** Solomon Islands */
  SB = 'SB',
  /** Seychelles */
  SC = 'SC',
  /** The Sudan */
  SD = 'SD',
  /** Sweden */
  SE = 'SE',
  /** Singapore */
  SG = 'SG',
  /** Saint Helena */
  SH = 'SH',
  /** Slovenia */
  SI = 'SI',
  /** Svalbard and Jan Mayen */
  SJ = 'SJ',
  /** Slovakia */
  SK = 'SK',
  /** Sierra Leone */
  SL = 'SL',
  /** San Marino */
  SM = 'SM',
  /** Senegal */
  SN = 'SN',
  /** Somalia */
  SO = 'SO',
  /** Suriname */
  SR = 'SR',
  /** Sao Tome and Principe */
  ST = 'ST',
  /** El Salvador */
  SV = 'SV',
  /** Syria */
  SY = 'SY',
  /** Swaziland */
  SZ = 'SZ',
  /** Turks and Caicos Islands */
  TC = 'TC',
  /** Chad */
  TD = 'TD',
  /** The French Southern Territories */
  TF = 'TF',
  /** Togo */
  TG = 'TG',
  /** Thailand */
  TH = 'TH',
  /** Tajikistan */
  TJ = 'TJ',
  /** Tokelau */
  TK = 'TK',
  /** Timor-Leste */
  TL = 'TL',
  /** Turkmenistan */
  TM = 'TM',
  /** Tunisia */
  TN = 'TN',
  /** Tonga */
  TO = 'TO',
  /** Turkey */
  TR = 'TR',
  /** Trinidad and Tobago */
  TT = 'TT',
  /** Tuvalu */
  TV = 'TV',
  /** Taiwan */
  TW = 'TW',
  /** Tanzania */
  TZ = 'TZ',
  /** Ukraine */
  UA = 'UA',
  /** Uganda */
  UG = 'UG',
  /** United States Minor Outlying Islands */
  UM = 'UM',
  /** The United States */
  US = 'US',
  /** Uruguay */
  UY = 'UY',
  /** Uzbekistan */
  UZ = 'UZ',
  /** The Holy See */
  VA = 'VA',
  /** Saint Vincent and The Grenadines */
  VC = 'VC',
  /** Venezuela */
  VE = 'VE',
  /** British Virgin Islands */
  VG = 'VG',
  /** US Virgin Islands */
  VI = 'VI',
  /** Viet Nam */
  VN = 'VN',
  /** Vanuatu */
  VU = 'VU',
  /** Wallis and Futuna */
  WF = 'WF',
  /** Samoa */
  WS = 'WS',
  /** Yemen */
  YE = 'YE',
  /** Mayotte */
  YT = 'YT',
  /** South Africa */
  ZA = 'ZA',
  /** Zambia */
  ZM = 'ZM',
  /** Zimbabwe */
  ZW = 'ZW'
}

/** This represents a Credit transaction */
export type Credit = Transaction & {
  __typename?: 'Credit';
  /** The account on the main side of the transaction (CREDIT -> recipient, DEBIT -> sender) */
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  fromAccount?: Maybe<Account>;
  /** Account that emitted the gift card used for this transaction (if any) */
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee: Amount;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isDisputed?: Maybe<Scalars['Boolean']>;
  isInReview?: Maybe<Scalars['Boolean']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  /** The account on the opposite side of the transaction (CREDIT -> sender, DEBIT -> recipient) */
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** Payment Processor Fee (usually in host currency) */
  paymentProcessorFee: Amount;
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this transaction */
  permissions: TransactionPermissions;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** This represents a Credit transaction */
export type CreditDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Credit transaction */
export type CreditRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

export type CreditCardCreateInput = {
  /** @deprecated 2022-11-22: the `token` parameter is sufficient */
  brand?: InputMaybe<Scalars['String']>;
  /** @deprecated 2022-11-22: the `token` parameter is sufficient */
  country?: InputMaybe<Scalars['String']>;
  /** @deprecated 2022-11-22: the `token` parameter is sufficient */
  expMonth?: InputMaybe<Scalars['Int']>;
  /** @deprecated 2022-11-22: the `token` parameter is sufficient */
  expYear?: InputMaybe<Scalars['Int']>;
  /** @deprecated 2022-11-22: the field was not used since 2017 */
  fullName?: InputMaybe<Scalars['String']>;
  /** @deprecated 2022-11-22: the `token` parameter is sufficient */
  funding?: InputMaybe<Scalars['String']>;
  token: Scalars['String'];
  zip?: InputMaybe<Scalars['String']>;
};

export type CreditCardWithStripeError = {
  __typename?: 'CreditCardWithStripeError';
  /** The payment method created */
  paymentMethod: PaymentMethod;
  /** This field will be set if there was an error with Stripe during strong customer authentication */
  stripeError?: Maybe<StripeError>;
};

/** All supported currencies */
export enum Currency {
  /** UAE Dirham */
  AED = 'AED',
  /** Afghani */
  AFN = 'AFN',
  /** Lek */
  ALL = 'ALL',
  /** Armenian Dram */
  AMD = 'AMD',
  /** Netherlands Antillean Guilder */
  ANG = 'ANG',
  /** Kwanza */
  AOA = 'AOA',
  /** Argentine Peso */
  ARS = 'ARS',
  /** Australian Dollar */
  AUD = 'AUD',
  /** Aruban Florin */
  AWG = 'AWG',
  /** Azerbaijanian Manat */
  AZN = 'AZN',
  /** Convertible Mark */
  BAM = 'BAM',
  /** Barbados Dollar */
  BBD = 'BBD',
  /** Taka */
  BDT = 'BDT',
  /** Bulgarian Lev */
  BGN = 'BGN',
  /** Burundi Franc */
  BIF = 'BIF',
  /** Bermudian Dollar */
  BMD = 'BMD',
  /** Brunei Dollar */
  BND = 'BND',
  /** Boliviano */
  BOB = 'BOB',
  /** Brazilian Real */
  BRL = 'BRL',
  /** Bahamian Dollar */
  BSD = 'BSD',
  /** Pula */
  BWP = 'BWP',
  /** Belarussian Ruble */
  BYN = 'BYN',
  /** Belize Dollar */
  BZD = 'BZD',
  /** Canadian Dollar */
  CAD = 'CAD',
  /** Congolese Franc */
  CDF = 'CDF',
  /** Swiss Franc */
  CHF = 'CHF',
  /** Chilean Peso */
  CLP = 'CLP',
  /** Yuan Renminbi */
  CNY = 'CNY',
  /** Colombian Peso */
  COP = 'COP',
  /** Costa Rican Colon */
  CRC = 'CRC',
  /** Cabo Verde Escudo */
  CVE = 'CVE',
  /** Czech Koruna */
  CZK = 'CZK',
  /** Djibouti Franc */
  DJF = 'DJF',
  /** Danish Krone */
  DKK = 'DKK',
  /** Dominican Peso */
  DOP = 'DOP',
  /** Algerian Dinar */
  DZD = 'DZD',
  /** Egyptian Pound */
  EGP = 'EGP',
  /** Ethiopian Birr */
  ETB = 'ETB',
  /** Euro */
  EUR = 'EUR',
  /** Fiji Dollar */
  FJD = 'FJD',
  /** Falkland Islands Pound */
  FKP = 'FKP',
  /** Pound Sterling */
  GBP = 'GBP',
  /** Lari */
  GEL = 'GEL',
  /** Gibraltar Pound */
  GIP = 'GIP',
  /** Dalasi */
  GMD = 'GMD',
  /** Guinea Franc */
  GNF = 'GNF',
  /** Quetzal */
  GTQ = 'GTQ',
  /** Guyana Dollar */
  GYD = 'GYD',
  /** Hong Kong Dollar */
  HKD = 'HKD',
  /** Lempira */
  HNL = 'HNL',
  /** Kuna */
  HRK = 'HRK',
  /** Gourde */
  HTG = 'HTG',
  /** Forint */
  HUF = 'HUF',
  /** Rupiah */
  IDR = 'IDR',
  /** New Israeli Sheqel */
  ILS = 'ILS',
  /** Indian Rupee */
  INR = 'INR',
  /** Iceland Krona */
  ISK = 'ISK',
  /** Jamaican Dollar */
  JMD = 'JMD',
  /** Yen */
  JPY = 'JPY',
  /** Kenyan Shilling */
  KES = 'KES',
  /** Som */
  KGS = 'KGS',
  /** Riel */
  KHR = 'KHR',
  /** Comoro Franc */
  KMF = 'KMF',
  /** Won */
  KRW = 'KRW',
  /** Cayman Islands Dollar */
  KYD = 'KYD',
  /** Tenge */
  KZT = 'KZT',
  /** Kip */
  LAK = 'LAK',
  /** Lebanese Pound */
  LBP = 'LBP',
  /** Sri Lanka Rupee */
  LKR = 'LKR',
  /** Liberian Dollar */
  LRD = 'LRD',
  /** Loti */
  LSL = 'LSL',
  /** Moroccan Dirham */
  MAD = 'MAD',
  /** Moldovan Leu */
  MDL = 'MDL',
  /** Malagasy Ariary */
  MGA = 'MGA',
  /** Denar */
  MKD = 'MKD',
  /** Kyat */
  MMK = 'MMK',
  /** Tugrik */
  MNT = 'MNT',
  /** Pataca */
  MOP = 'MOP',
  /** Mauritius Rupee */
  MUR = 'MUR',
  /** Rufiyaa */
  MVR = 'MVR',
  /** Kwacha */
  MWK = 'MWK',
  /** Mexican Peso */
  MXN = 'MXN',
  /** Malaysian Ringgit */
  MYR = 'MYR',
  /** Mozambique Metical */
  MZN = 'MZN',
  /** Namibia Dollar */
  NAD = 'NAD',
  /** Naira */
  NGN = 'NGN',
  /** Cordoba Oro */
  NIO = 'NIO',
  /** Norwegian Krone */
  NOK = 'NOK',
  /** Nepalese Rupee */
  NPR = 'NPR',
  /** New Zealand Dollar */
  NZD = 'NZD',
  /** Balboa */
  PAB = 'PAB',
  /** Nuevo Sol */
  PEN = 'PEN',
  /** Kina */
  PGK = 'PGK',
  /** Philippine Peso */
  PHP = 'PHP',
  /** Pakistan Rupee */
  PKR = 'PKR',
  /** Zloty */
  PLN = 'PLN',
  /** Guarani */
  PYG = 'PYG',
  /** Qatari Rial */
  QAR = 'QAR',
  /** Romanian Leu */
  RON = 'RON',
  /** Serbian Dinar */
  RSD = 'RSD',
  /** Russian Ruble */
  RUB = 'RUB',
  /** Rwanda Franc */
  RWF = 'RWF',
  /** Saudi Riyal */
  SAR = 'SAR',
  /** Solomon Islands Dollar */
  SBD = 'SBD',
  /** Seychelles Rupee */
  SCR = 'SCR',
  /** Swedish Krona */
  SEK = 'SEK',
  /** Singapore Dollar */
  SGD = 'SGD',
  /** Saint Helena Pound */
  SHP = 'SHP',
  /** Leone */
  SLL = 'SLL',
  /** Somali Shilling */
  SOS = 'SOS',
  /** Surinam Dollar */
  SRD = 'SRD',
  /** Lilangeni */
  SZL = 'SZL',
  /** Baht */
  THB = 'THB',
  /** Somoni */
  TJS = 'TJS',
  /** Pa’anga */
  TOP = 'TOP',
  /** Turkish Lira */
  TRY = 'TRY',
  /** Trinidad and Tobago Dollar */
  TTD = 'TTD',
  /** New Taiwan Dollar */
  TWD = 'TWD',
  /** Tanzanian Shilling */
  TZS = 'TZS',
  /** Hryvnia */
  UAH = 'UAH',
  /** Uganda Shilling */
  UGX = 'UGX',
  /** US Dollar */
  USD = 'USD',
  /** Peso Uruguayo */
  UYU = 'UYU',
  /** Uzbekistan Sum */
  UZS = 'UZS',
  /** Dong */
  VND = 'VND',
  /** Vatu */
  VUV = 'VUV',
  /** Tala */
  WST = 'WST',
  /** CFA Franc BEAC */
  XAF = 'XAF',
  /** East Caribbean Dollar */
  XCD = 'XCD',
  /** CFA Franc BCEAO */
  XOF = 'XOF',
  /** CFP Franc */
  XPF = 'XPF',
  /** Yemeni Rial */
  YER = 'YER',
  /** Rand */
  ZAR = 'ZAR',
  /** Zambian Kwacha */
  ZMW = 'ZMW'
}

/** Fields for a currency fx rate */
export type CurrencyExchangeRate = {
  __typename?: 'CurrencyExchangeRate';
  /** Date of the FX rate */
  date: Scalars['DateTime'];
  fromCurrency: Currency;
  /** Is the FX rate approximate or a fixed value? */
  isApproximate: Scalars['Boolean'];
  /** Where does the FX rate comes from */
  source: CurrencyExchangeRateSourceType;
  toCurrency: Currency;
  /** Exchange rate value as a scalar (e.g 1.15 or 0.86) */
  value: Scalars['Float'];
};

/** Where does the FX rate come from */
export enum CurrencyExchangeRateSourceType {
  /** Open Collective internal system, relying on caching and 3rd party APIs */
  OPENCOLLECTIVE = 'OPENCOLLECTIVE',
  /** PayPal API */
  PAYPAL = 'PAYPAL',
  /** Wise API */
  WISE = 'WISE'
}

/** All possible DateTime fields for a resource */
export enum DateTimeField {
  /** The creation time of a resource */
  CREATED_AT = 'CREATED_AT'
}

/** This represents a Debit transaction */
export type Debit = Transaction & {
  __typename?: 'Debit';
  /** The account on the main side of the transaction (CREDIT -> recipient, DEBIT -> sender) */
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  fromAccount?: Maybe<Account>;
  /** Account that emitted the gift card used for this transaction (if any) */
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee: Amount;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isDisputed?: Maybe<Scalars['Boolean']>;
  isInReview?: Maybe<Scalars['Boolean']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  /** The account on the opposite side of the transaction (CREDIT -> sender, DEBIT -> recipient) */
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** Payment Processor Fee (usually in host currency) */
  paymentProcessorFee: Amount;
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this transaction */
  permissions: TransactionPermissions;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** This represents a Debit transaction */
export type DebitDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** This represents a Debit transaction */
export type DebitRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

export type Expense_Author_Cannot_Approve = {
  __typename?: 'EXPENSE_AUTHOR_CANNOT_APPROVE';
  amountInCents?: Maybe<Scalars['Int']>;
  appliesToHostedCollectives?: Maybe<Scalars['Boolean']>;
  appliesToSingleAdminCollectives?: Maybe<Scalars['Boolean']>;
  enabled?: Maybe<Scalars['Boolean']>;
};

export type EmojiReactionResponse = {
  __typename?: 'EmojiReactionResponse';
  /** Reference to the comment corresponding to the emojis */
  comment?: Maybe<Comment>;
  /** Reference to the update corresponding to the emojis */
  update?: Maybe<Update>;
};

/** This represents an Event account */
export type Event = Account & AccountWithContributions & AccountWithHost & AccountWithParent & {
  __typename?: 'Event';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  /** The Event end date and time */
  endsAt?: Maybe<Scalars['DateTime']>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** The Account parenting this account */
  parent?: Maybe<Account>;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  /** The Event start date and time */
  startsAt?: Maybe<Scalars['DateTime']>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Timezone of the Event (TZ database format, e.g. UTC or Europe/Berlin) */
  timezone?: Maybe<Scalars['String']>;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Event account */
export type EventBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Event account */
export type EventChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Event account */
export type EventExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Event account */
export type EventHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Event account */
export type EventImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Event account */
export type EventMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Event account */
export type EventOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Event account */
export type EventTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Event account */
export type EventTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Event account */
export type EventUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Event account */
export type EventVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Event account */
export type EventWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type EventCreateInput = {
  description?: InputMaybe<Scalars['String']>;
  /** The Event end date and time */
  endsAt: Scalars['DateTime'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug?: InputMaybe<Scalars['String']>;
  /** The Event start date and time */
  startsAt: Scalars['DateTime'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** Timezone of the Event (TZ database format, e.g. UTC or Europe/Berlin) */
  timezone: Scalars['String'];
};

/** This represents an Expense */
export type Expense = {
  __typename?: 'Expense';
  /** The account where the expense was submitted */
  account: Account;
  /**
   * The exchange rate between the expense currency and the account currency
   * @deprecated 2022-02-09: Please use amountV2
   */
  accountCurrencyFxRate: Scalars['Float'];
  /** The list of activities (ie. approved, edited, etc) for this expense ordered by date ascending */
  activities: Array<Activity>;
  /**
   * Total amount of the expense (sum of the item's amounts).
   * @deprecated 2022-02-09: Please use amountV2
   */
  amount: Scalars['Int'];
  /** Total amount of the expense */
  amountV2?: Maybe<Amount>;
  /** (Optional) files attached to the expense */
  attachedFiles?: Maybe<Array<ExpenseAttachedFile>>;
  /** Returns the list of comments for this expense, or `null` if user is not allowed to see them */
  comments?: Maybe<CommentCollection>;
  /** The time of creation */
  createdAt: Scalars['DateTime'];
  /** The account who created this expense */
  createdByAccount?: Maybe<Account>;
  /** Currency that should be used for the payout */
  currency: Currency;
  /** Title/main description for this expense */
  description: Scalars['String'];
  /** Drafted field values that were still not persisted */
  draft?: Maybe<Scalars['JSON']>;
  /** The fees payer for this expense */
  feesPayer: FeesPayer;
  /** The account from where the expense was paid */
  host?: Maybe<Account>;
  id: Scalars['String'];
  /** Information to display on the invoice. Only visible to user and admins. */
  invoiceInfo?: Maybe<Scalars['String']>;
  items?: Maybe<Array<Maybe<ExpenseItem>>>;
  /** Legacy ID as returned by API V1. Avoid relying on this field as it may be removed in the future. */
  legacyId: Scalars['Int'];
  /** Longer description for this expense */
  longDescription?: Maybe<Scalars['String']>;
  /** The account being paid by this expense */
  payee: Account;
  /** The address of the payee */
  payeeLocation?: Maybe<Location>;
  /** The payout method to use for this expense */
  payoutMethod?: Maybe<PayoutMethod>;
  /** The permissions given to current logged in user for this expense */
  permissions: ExpensePermissions;
  /** Additional information about the payment as HTML. Only visible to user and admins. */
  privateMessage?: Maybe<Scalars['String']>;
  quote?: Maybe<ExpenseQuote>;
  recurringExpense?: Maybe<RecurringExpense>;
  /** The account that requested this expense to be submitted */
  requestedByAccount?: Maybe<Account>;
  /** Returns the list of legal documents required from the payee before the expense can be payed. Must be logged in. */
  requiredLegalDocuments?: Maybe<Array<Maybe<LegalDocumentType>>>;
  securityChecks?: Maybe<Array<Maybe<SecurityCheck>>>;
  /** The state of the expense (pending, approved, paid, rejected...etc) */
  status: ExpenseStatus;
  tags: Array<Maybe<Scalars['String']>>;
  /** Taxes applied to this expense */
  taxes: Array<Maybe<TaxInfo>>;
  /** Whether this expense is a receipt or an invoice */
  type: ExpenseType;
  /** The virtual card used to pay for this charge */
  virtualCard?: Maybe<VirtualCard>;
};


/** This represents an Expense */
export type ExpenseAmountV2Args = {
  currencySource?: InputMaybe<ExpenseCurrencySource>;
};


/** This represents an Expense */
export type ExpenseCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
};

/** Fields for an expense's attached file */
export type ExpenseAttachedFile = {
  __typename?: 'ExpenseAttachedFile';
  /** Unique identifier for this file */
  id: Scalars['String'];
  /** The file info associated with this item (if any) */
  info?: Maybe<FileInfo>;
  /**
   * The original filename
   * @deprecated 2023-01-23: We're moving this field to "file.name"
   */
  name?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['URL']>;
};

export type ExpenseAttachedFileInput = {
  /** ID of the file */
  id?: InputMaybe<Scalars['String']>;
  /**
   * Original filename
   * @deprecated 2023-02-02: This must now be provided when uploading the file. This parameter will be ignored.
   */
  name?: InputMaybe<Scalars['String']>;
  /** URL of the file */
  url: Scalars['URL'];
};

/** A collection of "Expenses" */
export type ExpenseCollection = Collection & {
  __typename?: 'ExpenseCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Expense>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type ExpenseCreateInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<ExpenseAttachedFileInput>>;
  /** Currency that should be used for the payout. Defaults to the account currency */
  currency?: InputMaybe<Currency>;
  /** Main title of the expense */
  description: Scalars['String'];
  /** Custom information to print on the invoice */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<ExpenseItemCreateInput>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee: AccountReferenceInput;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod: PayoutMethodInput;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The list of taxes that should be applied to the expense (VAT, GST, etc...) */
  tax?: InputMaybe<Array<InputMaybe<ExpenseTaxInput>>>;
  /** The type of the expense */
  type: ExpenseType;
};

/** All supported expense currency sources */
export enum ExpenseCurrencySource {
  /** The expense currency expressed as the account currency */
  ACCOUNT = 'ACCOUNT',
  /** The expense currency expressed as the expense currency */
  CREATED_BY_ACCOUNT = 'CREATED_BY_ACCOUNT',
  /** The expense currency expressed as the expense currency */
  EXPENSE = 'EXPENSE',
  /** The expense currency expressed as the host currency */
  HOST = 'HOST'
}

export type ExpenseInviteDraftInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<InputMaybe<Scalars['JSON']>>>;
  /** Main title of the expense */
  description?: InputMaybe<Scalars['String']>;
  /** Tax ID, VAT number...etc This information will be printed on your invoice. */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<Scalars['JSON']>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee: ExpenseInvitee;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod?: InputMaybe<PayoutMethodInput>;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Note to be sent to the invited user through email. */
  recipientNote?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The type of the expense */
  type: ExpenseType;
};

export type ExpenseInvitee = {
  email?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['Int']>;
  isInvite?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  organization?: InputMaybe<ExpenseInviteeOrganizationInput>;
  slug?: InputMaybe<Scalars['String']>;
};

export type ExpenseInviteeOrganizationInput = {
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

/** Fields for an expense item */
export type ExpenseItem = {
  __typename?: 'ExpenseItem';
  /** Amount of this item */
  amount: Scalars['Int'];
  /** The date on which the item was created */
  createdAt: Scalars['DateTime'];
  /** A description for this item. Enforced for new items, but old expenses may not have one. */
  description?: Maybe<Scalars['String']>;
  /** The file associated with this item (if any) */
  file?: Maybe<FileInfo>;
  /** Unique identifier for this expense item */
  id: Scalars['String'];
  /** The date on which the expense took place */
  incurredAt: Scalars['DateTime'];
  /** The date on which the item was last updated */
  updatedAt: Scalars['DateTime'];
  url?: Maybe<Scalars['URL']>;
};

export type ExpenseItemCreateInput = {
  /** Amount in cents */
  amount: Scalars['Int'];
  /** What is this item about? */
  description: Scalars['String'];
  /** When was the money spent? */
  incurredAt?: InputMaybe<Scalars['DateString']>;
  /** URL of the file linked to this item. Must be provided if the expense type is RECEIPT. */
  url?: InputMaybe<Scalars['URL']>;
};

export type ExpenseItemInput = {
  /** Amount in cents */
  amount?: InputMaybe<Scalars['Int']>;
  /** What is this item about? */
  description?: InputMaybe<Scalars['String']>;
  /** ID of the item */
  id?: InputMaybe<Scalars['String']>;
  /** When was the money spent? */
  incurredAt?: InputMaybe<Scalars['DateString']>;
  /** URL of the file linked to this item. Must be provided if the expense type is RECEIPT. */
  url?: InputMaybe<Scalars['URL']>;
};

/** Fields for the user permissions on an expense */
export type ExpensePermissions = {
  __typename?: 'ExpensePermissions';
  approve: Permission;
  /** Whether the current user can approve this expense */
  canApprove: Scalars['Boolean'];
  /** Whether the current user can comment and see comments for this expense */
  canComment: Scalars['Boolean'];
  /** Whether the current user can edit the expense */
  canDelete: Scalars['Boolean'];
  /** Whether the current user can edit the expense */
  canEdit: Scalars['Boolean'];
  /** Tags permissions are a bit different, and can be edited by admins even if the expense has already been paid */
  canEditTags: Scalars['Boolean'];
  /** Whether the current user can mark this expense as incomplete */
  canMarkAsIncomplete: Scalars['Boolean'];
  /** Whether the current user can mark this expense as spam */
  canMarkAsSpam: Scalars['Boolean'];
  /** Whether the current user can mark this expense as unpaid */
  canMarkAsUnpaid: Scalars['Boolean'];
  /** Whether the current user can trigger the payment for this expense */
  canPay: Scalars['Boolean'];
  /** Whether the current user can reject this expense */
  canReject: Scalars['Boolean'];
  /** Whether the current user can the the invoice info for this expense */
  canSeeInvoiceInfo: Scalars['Boolean'];
  /** Whether the current user can unapprove this expense */
  canUnapprove: Scalars['Boolean'];
  /** Whether the current user can unschedule this expense payment */
  canUnschedulePayment: Scalars['Boolean'];
  comment: Permission;
  delete: Permission;
  edit: Permission;
  editTags: Permission;
  id: Scalars['String'];
  markAsSpam: Permission;
  markAsUnpaid: Permission;
  pay: Permission;
  reject: Permission;
  seeInvoiceInfo: Permission;
  unapprove: Permission;
  unschedulePayment: Permission;
};

/** All supported expense types */
export enum ExpenseProcessAction {
  /** To mark the expense as approved */
  APPROVE = 'APPROVE',
  /** To mark the expense as incomplete and notify the payee it requires more information */
  MARK_AS_INCOMPLETE = 'MARK_AS_INCOMPLETE',
  /** To mark the expense as spam */
  MARK_AS_SPAM = 'MARK_AS_SPAM',
  /** To mark the expense as unpaid (marks the transaction as refunded) */
  MARK_AS_UNPAID = 'MARK_AS_UNPAID',
  /** To trigger the payment */
  PAY = 'PAY',
  /** To mark the expense as rejected */
  REJECT = 'REJECT',
  /** To schedule the expense for payment */
  SCHEDULE_FOR_PAYMENT = 'SCHEDULE_FOR_PAYMENT',
  /** To mark the expense as pending after it has been approved */
  UNAPPROVE = 'UNAPPROVE',
  /** To unschedule the expense payment */
  UNSCHEDULE_PAYMENT = 'UNSCHEDULE_PAYMENT'
}

/** Fields for an expense quote */
export type ExpenseQuote = {
  __typename?: 'ExpenseQuote';
  /** The date on which the item was created */
  estimatedDeliveryAt?: Maybe<Scalars['DateTime']>;
  /** Amount of payment processor fee */
  paymentProcessorFeeAmount: Amount;
  /** Amount of this item */
  sourceAmount: Amount;
};

export type ExpenseReferenceInput = {
  /** The public id identifying the expense (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the expense (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** Expense statistics related to the given accounts */
export type ExpenseStats = {
  __typename?: 'ExpenseStats';
  /** The daily average paid in expenses */
  dailyAverageAmount: Amount;
  /** The total number of expenses */
  expensesCount: Scalars['Int'];
  /** Number of grants */
  grantsCount: Scalars['Int'];
  /** Number of invoices */
  invoicesCount: Scalars['Int'];
  /** Number of reimbursements */
  reimbursementsCount: Scalars['Int'];
};

export enum ExpenseStatus {
  APPROVED = 'APPROVED',
  CANCELED = 'CANCELED',
  DRAFT = 'DRAFT',
  ERROR = 'ERROR',
  INCOMPLETE = 'INCOMPLETE',
  PAID = 'PAID',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  REJECTED = 'REJECTED',
  SCHEDULED_FOR_PAYMENT = 'SCHEDULED_FOR_PAYMENT',
  SPAM = 'SPAM',
  UNVERIFIED = 'UNVERIFIED'
}

/** Describes the values allowed to filter expenses, namely all the expense statuses and the special "READY_TO_PAY" value. */
export enum ExpenseStatusFilter {
  APPROVED = 'APPROVED',
  CANCELED = 'CANCELED',
  DRAFT = 'DRAFT',
  ERROR = 'ERROR',
  INCOMPLETE = 'INCOMPLETE',
  PAID = 'PAID',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  /** Only expenses that are ready to be paid (must be approved, have the sufficiant balance and have the tax forms completed) */
  READY_TO_PAY = 'READY_TO_PAY',
  REJECTED = 'REJECTED',
  SCHEDULED_FOR_PAYMENT = 'SCHEDULED_FOR_PAYMENT',
  SPAM = 'SPAM',
  UNVERIFIED = 'UNVERIFIED'
}

/** Input to set taxes for an expense */
export type ExpenseTaxInput = {
  /** Tax identification number, if any */
  idNumber?: InputMaybe<Scalars['String']>;
  /** Tax rate as a float number between 0 and 1 */
  rate: Scalars['Float'];
  type: TaxType;
};

/** All supported expense types */
export enum ExpenseType {
  /** Credit Card Charge: Payment done using an issued (virtual) credit card issued by your Fiscal Host. */
  CHARGE = 'CHARGE',
  /** Funding Request: Request funding for a project or initiative. */
  FUNDING_REQUEST = 'FUNDING_REQUEST',
  /** Grant: Request funding for a project or initiative. */
  GRANT = 'GRANT',
  /** Invoice: Charge for your time or get paid in advance. */
  INVOICE = 'INVOICE',
  /** Receipt: Get paid back for a purchase already made. */
  RECEIPT = 'RECEIPT',
  /** Settlement: expense generated by Open Collective to collect money owed by Fiscal Hosts. */
  SETTLEMENT = 'SETTLEMENT',
  /** Unclassified expense */
  UNCLASSIFIED = 'UNCLASSIFIED'
}

export type ExpenseUpdateInput = {
  /** (Optional) A list of files that you want to attach to this expense */
  attachedFiles?: InputMaybe<Array<ExpenseAttachedFileInput>>;
  /** @deprecated 2020-04-08: Please use the items field - The list of items for this expense. Total amount will be computed from them. */
  attachments?: InputMaybe<Array<InputMaybe<ExpenseItemInput>>>;
  /** Currency that should be used for the payout. Defaults to the account currency */
  currency?: InputMaybe<Currency>;
  /** Main title of the expense */
  description?: InputMaybe<Scalars['String']>;
  /** ID of the expense that you are trying to edit */
  id: Scalars['String'];
  /** Tax ID, VAT number...etc This information will be printed on your invoice. */
  invoiceInfo?: InputMaybe<Scalars['String']>;
  /** The list of items for this expense. Total amount will be computed from them. */
  items?: InputMaybe<Array<InputMaybe<ExpenseItemInput>>>;
  /** Longer text to attach to the expense */
  longDescription?: InputMaybe<Scalars['String']>;
  /** Account to reimburse */
  payee?: InputMaybe<NewAccountOrReferenceInput>;
  /** The address of the payee */
  payeeLocation?: InputMaybe<LocationInput>;
  /** The payout method that will be used to reimburse the expense */
  payoutMethod?: InputMaybe<PayoutMethodInput>;
  /** A private note that will be attached to your invoice, as HTML */
  privateMessage?: InputMaybe<Scalars['String']>;
  /** Tags associated to the expense (ie. Food, Engineering...) */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** The list of taxes that should be applied to the expense (VAT, GST, etc...) */
  tax?: InputMaybe<Array<InputMaybe<ExpenseTaxInput>>>;
  /** The type of the expense */
  type?: InputMaybe<ExpenseType>;
};

/** All supported expense types */
export enum FeesPayer {
  /** The collective will be responsible for paying the fees */
  COLLECTIVE = 'COLLECTIVE',
  /** The payee will be responsible for paying the fees (they'll be deduced from the total amount) */
  PAYEE = 'PAYEE'
}

/** Exposes information about an uploaded file (image, pdf, etc.) */
export type FileInfo = {
  /** Unique identifier for the file */
  id: Scalars['String'];
  /** Name of the file */
  name?: Maybe<Scalars['String']>;
  /** Size of the file in bytes */
  size?: Maybe<Scalars['Int']>;
  /** Mime type of the file */
  type: Scalars['String'];
  /** URL to access the file */
  url: Scalars['URL'];
};

/** This represents an Project account */
export type Fund = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Fund';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Project account */
export type FundBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type FundChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type FundExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type FundHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Project account */
export type FundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type FundMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type FundOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Project account */
export type FundTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Project account */
export type FundTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Project account */
export type FundUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type FundVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type FundWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type FundCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type GenericFileInfo = FileInfo & {
  __typename?: 'GenericFileInfo';
  /** Unique identifier for the file */
  id: Scalars['String'];
  /** Name of the file */
  name?: Maybe<Scalars['String']>;
  /** Size of the file in bytes */
  size?: Maybe<Scalars['Int']>;
  /** Mime type of the file */
  type: Scalars['String'];
  /** URL to access the file */
  url: Scalars['URL'];
};

/** Input type for guest contributions */
export type GuestInfoInput = {
  /** Captcha validation for creating an order */
  captcha?: InputMaybe<CaptchaInput>;
  /** Contributor's email */
  email: Scalars['EmailAddress'];
  /** Legal name of the user */
  legalName?: InputMaybe<Scalars['String']>;
  /** Address of the user, mandatory when amount is above $5000. */
  location?: InputMaybe<LocationInput>;
  /** Display name of the user */
  name?: InputMaybe<Scalars['String']>;
};

/** This represents an Host account */
export type Host = Account & AccountWithContributions & {
  __typename?: 'Host';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  bankAccount?: Maybe<PayoutMethod>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  contributionStats: ContributionStats;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  expenseStats: ExpenseStats;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns whether the host has any Stripe disputed orders */
  hasDisputedOrders: Scalars['Boolean'];
  /** Returns whether the host has any Stripe in review orders */
  hasInReviewOrders: Scalars['Boolean'];
  hostFeePercent?: Maybe<Scalars['Float']>;
  hostMetrics: HostMetrics;
  hostMetricsTimeSeries: HostMetricsTimeSeries;
  hostedVirtualCardCollectives: AccountCollection;
  hostedVirtualCardMerchants: AccountCollection;
  hostedVirtualCards: VirtualCardCollection;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  isOpenToApplications?: Maybe<Scalars['Boolean']>;
  /** Returns whether the host is trusted or not */
  isTrustedHost: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** If the host supports PayPal, this will contain the client ID to use in the frontend */
  paypalClientId?: Maybe<Scalars['String']>;
  /** Paypal preapproval info. Returns null if PayPal account is not connected. */
  paypalPreApproval?: Maybe<PaymentMethod>;
  /** Pending applications for this host */
  pendingApplications: HostApplicationCollection;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  plan: HostPlan;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  /** The list of payment methods (Stripe, Paypal, manual bank transfer, etc ...) the Host can accept for its Collectives */
  supportedPaymentMethods?: Maybe<Array<Maybe<PaymentMethodLegacyType>>>;
  /** The list of payout methods this Host accepts for its expenses */
  supportedPayoutMethods?: Maybe<Array<Maybe<PayoutMethodType>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  termsUrl?: Maybe<Scalars['URL']>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  totalHostedCollectives?: Maybe<Scalars['Int']>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** Transferwise balances. Returns null if Transferwise account is not connected. */
  transferwiseBalances?: Maybe<Array<Maybe<Amount>>>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Host account */
export type HostBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Host account */
export type HostChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostContributionStatsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Host account */
export type HostExpenseStatsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostMetricsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
};


/** This represents an Host account */
export type HostHostMetricsTimeSeriesArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  timeUnit?: InputMaybe<TimeUnit>;
};


/** This represents an Host account */
export type HostHostedVirtualCardCollectivesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostedVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostHostedVirtualCardsArgs = {
  collectiveAccountIds?: InputMaybe<Array<InputMaybe<AccountReferenceInput>>>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Host account */
export type HostMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Host account */
export type HostOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Host account */
export type HostPendingApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Host account */
export type HostTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Host account */
export type HostUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Host account */
export type HostVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Host account */
export type HostWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type HostApplication = {
  __typename?: 'HostApplication';
  /** The account who applied to this host */
  account: Account;
  /** The date on which the item was created */
  createdAt: Scalars['DateTime'];
  customData?: Maybe<Scalars['JSON']>;
  id: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  status?: Maybe<HostApplicationStatus>;
};

/** A collection of "HostApplication" */
export type HostApplicationCollection = Collection & {
  __typename?: 'HostApplicationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<HostApplication>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum HostApplicationStatus {
  APPROVED = 'APPROVED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED'
}

/** A collection of "Hosts" */
export type HostCollection = Collection & {
  __typename?: 'HostCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Host>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** All supported expense types */
export enum HostFeeStructure {
  /** Custom fee for this Collective only */
  CUSTOM_FEE = 'CUSTOM_FEE',
  /** Use global host fees */
  DEFAULT = 'DEFAULT',
  /** Set a monthly retainer for this Collective */
  MONTHLY_RETAINER = 'MONTHLY_RETAINER'
}

/** Host metrics related to collected and pending fees/tips. */
export type HostMetrics = {
  __typename?: 'HostMetrics';
  /** Amount in host fee shared with the platform */
  hostFeeShare?: Maybe<Amount>;
  /** Host fee sharing percent */
  hostFeeSharePercent?: Maybe<Scalars['Float']>;
  /** Amount collected in host fees for given period */
  hostFees?: Maybe<Amount>;
  /** Amount in host fee shared  requiring settlement */
  pendingHostFeeShare?: Maybe<Amount>;
  /** Amount collected in platform fees requiring settlement */
  pendingPlatformFees?: Maybe<Amount>;
  /** Amount collected in platform tips requiring settlement */
  pendingPlatformTips?: Maybe<Amount>;
  /** Amount collected in platform fees for given period */
  platformFees?: Maybe<Amount>;
  /** Amount collected in platform tips for given period */
  platformTips?: Maybe<Amount>;
  /** Amount in host fee shared not requiring settlement */
  settledHostFeeShare?: Maybe<Amount>;
  /** Total amount managed on behalf of hosted collectives */
  totalMoneyManaged?: Maybe<Amount>;
};

/** Host metrics time series */
export type HostMetricsTimeSeries = {
  __typename?: 'HostMetricsTimeSeries';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** History of the share of host fees collected owed to Open Collective Inc. */
  hostFeeShare: TimeSeriesAmountWithSettlement;
  /** History of the host fees collected */
  hostFees: TimeSeriesAmount;
  /** History of the collected platform tips */
  platformTips: TimeSeriesAmount;
  /** The interval between two data points */
  timeUnit: TimeUnit;
  /** History of the total money managed by this host */
  totalMoneyManaged: TimeSeriesAmount;
  /** History of the total money received by this host */
  totalReceived: TimeSeriesAmountWithKind;
  /** History of the total money spent by this host */
  totalSpent: TimeSeriesAmountWithKind;
};

/** The name of the current plan and its characteristics. */
export type HostPlan = {
  __typename?: 'HostPlan';
  /** Whether this plan allows to use the added funds feature */
  addedFunds?: Maybe<Scalars['Int']>;
  /** Amount limit for the added funds feature under this plan */
  addedFundsLimit?: Maybe<Scalars['Int']>;
  /** Whether this plan allows to use the bank transfers feature */
  bankTransfers?: Maybe<Scalars['Int']>;
  /** Amount limit for the bank transfers feature under this plan */
  bankTransfersLimit?: Maybe<Scalars['Int']>;
  /** Whether this plan allows to use the host dashboard */
  hostDashboard?: Maybe<Scalars['Boolean']>;
  /** Charge on revenues made through Host Fees. */
  hostFeeSharePercent?: Maybe<Scalars['Float']>;
  /** Ability to charge Host Fees. */
  hostFees?: Maybe<Scalars['Boolean']>;
  /** Number of collectives hosted */
  hostedCollectives?: Maybe<Scalars['Int']>;
  /** Max number of collectives than can be hosted */
  hostedCollectivesLimit?: Maybe<Scalars['Int']>;
  /** The public id identifying the account (ie: 5v08jk63-w4g9nbpz-j7qmyder-p7ozax5g) */
  id?: Maybe<Scalars['String']>;
  /** Whether this plan allows to use the manual payments feature */
  manualPayments?: Maybe<Scalars['Boolean']>;
  /** The name of the plan */
  name?: Maybe<Scalars['String']>;
  /** Ability to collect Platform Tips. */
  platformTips?: Maybe<Scalars['Boolean']>;
  /** Whether this plan allows to use the transferwise payouts feature */
  transferwisePayouts?: Maybe<Scalars['Int']>;
  /** Amount limit for the transferwise payouts feature under this plan */
  transferwisePayoutsLimit?: Maybe<Scalars['Int']>;
};

/** Exposes information about an uploaded image file */
export type ImageFileInfo = FileInfo & {
  __typename?: 'ImageFileInfo';
  /** Blurhash of the image */
  blurHash?: Maybe<Scalars['String']>;
  /** If the file is an image, this will be the height of the image in pixels */
  height?: Maybe<Scalars['Int']>;
  /** Unique identifier for the file */
  id: Scalars['String'];
  /** Name of the file */
  name?: Maybe<Scalars['String']>;
  /** Size of the file in bytes */
  size?: Maybe<Scalars['Int']>;
  /** Mime type of the file */
  type: Scalars['String'];
  /** URL to access the file */
  url: Scalars['URL'];
  /** If the file is an image, this will be the width of the image in pixels */
  width?: Maybe<Scalars['Int']>;
};

export enum ImageFormat {
  gif = 'gif',
  jpg = 'jpg',
  png = 'png',
  svg = 'svg',
  txt = 'txt'
}

/** This represents an Individual account */
export type Individual = Account & {
  __typename?: 'Individual';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Email for the account. For authenticated user: scope: "email". */
  email?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Has the account a password set? For authenticated user: scope: "account". */
  hasPassword?: Maybe<Scalars['Boolean']>;
  hasSeenLatestChangelogEntry: Scalars['Boolean'];
  hasTwoFactorAuth?: Maybe<Scalars['Boolean']>;
  /** If the individual is a host account, this will return the matching Host object */
  host?: Maybe<Host>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  isFollowingConversation: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  isGuest: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /**
   *
   *           Address. This field is public for hosts, otherwise:
   *             - Users can see their own address
   *             - Hosts can see the address of users submitting expenses to their collectives
   *
   */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  newsletterOptIn?: Maybe<Scalars['Boolean']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  oAuthAuthorizations?: Maybe<OAuthAuthorizationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** The list of personal tokens created by this account. Admin only. Scope: "applications". */
  personalTokens?: Maybe<PersonalTokenCollection>;
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Individual account */
export type IndividualBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Individual account */
export type IndividualChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Individual account */
export type IndividualIsFollowingConversationArgs = {
  id: Scalars['String'];
};


/** This represents an Individual account */
export type IndividualMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Individual account */
export type IndividualMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Individual account */
export type IndividualOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualOAuthAuthorizationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Individual account */
export type IndividualPersonalTokensArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Individual account */
export type IndividualUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Individual account */
export type IndividualVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Individual account */
export type IndividualWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type IndividualCreateInput = {
  email: Scalars['String'];
  name: Scalars['String'];
};

export type InviteMemberInput = {
  description?: InputMaybe<Scalars['String']>;
  /** Reference to an account for the invitee */
  memberAccount?: InputMaybe<AccountReferenceInput>;
  /** Email and name of the invitee if no reference. */
  memberInfo?: InputMaybe<IndividualCreateInput>;
  /** Role of the invitee */
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};

/** Type for a required legal document */
export enum LegalDocumentType {
  /** US tax form (W9) */
  US_TAX_FORM = 'US_TAX_FORM'
}

/** Type for Geographic location */
export type Location = {
  __typename?: 'Location';
  /** Postal address without country (eg. 12 opensource avenue, 7500 Paris) */
  address?: Maybe<Scalars['String']>;
  /** Two letters country code (eg. FR, BE...etc) */
  country?: Maybe<Scalars['String']>;
  /** Unique identifier for this location */
  id?: Maybe<Scalars['String']>;
  /** Latitude */
  lat?: Maybe<Scalars['Float']>;
  /** Longitude */
  long?: Maybe<Scalars['Float']>;
  /** A short name for the location (eg. Open Collective Headquarters) */
  name?: Maybe<Scalars['String']>;
  /** Structured JSON address */
  structured?: Maybe<Scalars['JSON']>;
};

/** Input type for Geographic location */
export type LocationInput = {
  /** Postal address without country (eg. 12 opensource avenue, 7500 Paris) */
  address?: InputMaybe<Scalars['String']>;
  /** Two letters country code (eg. FR, BE...etc) */
  country?: InputMaybe<CountryIso>;
  /** Latitude */
  lat?: InputMaybe<Scalars['Float']>;
  /** Longitude */
  long?: InputMaybe<Scalars['Float']>;
  /** A short name for the location (eg. Open Collective Headquarters) */
  name?: InputMaybe<Scalars['String']>;
  /** Structured JSON address */
  structured?: InputMaybe<Scalars['JSON']>;
};

export type Maximum_Virtual_Card_Limit_Amount_For_Interval = {
  __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL';
  ALL_TIME?: Maybe<Amount>;
  DAILY?: Maybe<Amount>;
  MONTHLY?: Maybe<Amount>;
  PER_AUTHORIZATION?: Maybe<Amount>;
  WEEKLY?: Maybe<Amount>;
  YEARLY?: Maybe<Amount>;
};

/** This represents a Member relationship (ie: Organization backing a Collective) */
export type Member = {
  __typename?: 'Member';
  account?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom user description */
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** If membership is inherited from parent collective */
  inherited?: Maybe<Scalars['Boolean']>;
  /** Custom user message from member to the collective */
  publicMessage?: Maybe<Scalars['String']>;
  role?: Maybe<MemberRole>;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
  /** Total amount donated */
  totalDonations: Amount;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of "Members" (ie: Organization backing a Collective) */
export type MemberCollection = Collection & {
  __typename?: 'MemberCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Member>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An invitation to join the members of a collective */
export type MemberInvitation = {
  __typename?: 'MemberInvitation';
  account: Account;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  /** The person who invited the member, if any */
  inviter?: Maybe<Individual>;
  memberAccount: Account;
  role: MemberRole;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
};

export type MemberInvitationReferenceInput = {
  /** The public id identifying the member invitation (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the invitation (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** This represents a MemberOf relationship (ie: Collective backed by an Organization) */
export type MemberOf = {
  __typename?: 'MemberOf';
  account?: Maybe<Account>;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** Custom user description */
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  /** If membership is inherited from parent collective */
  inherited?: Maybe<Scalars['Boolean']>;
  /** Custom user message from member to the collective */
  publicMessage?: Maybe<Scalars['String']>;
  role?: Maybe<MemberRole>;
  since?: Maybe<Scalars['DateTime']>;
  tier?: Maybe<Tier>;
  /** Total amount donated */
  totalDonations: Amount;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of "MemberOf" (ie: Collective backed by an Organization) */
export type MemberOfCollection = Collection & {
  __typename?: 'MemberOfCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<MemberOf>>>;
  offset?: Maybe<Scalars['Int']>;
  roles?: Maybe<Array<Maybe<MemberOfCollectionRoles>>>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An existing member role and account type combination used used to filter collections */
export type MemberOfCollectionRoles = {
  __typename?: 'MemberOfCollectionRoles';
  role: MemberRole;
  type: AccountType;
};

/** All member roles */
export enum MemberRole {
  ACCOUNTANT = 'ACCOUNTANT',
  ADMIN = 'ADMIN',
  ATTENDEE = 'ATTENDEE',
  BACKER = 'BACKER',
  CONNECTED_ACCOUNT = 'CONNECTED_ACCOUNT',
  CONTRIBUTOR = 'CONTRIBUTOR',
  FOLLOWER = 'FOLLOWER',
  /** @deprecated 2022-09-12: This role does not exist anymore */
  FUNDRAISER = 'FUNDRAISER',
  HOST = 'HOST',
  MEMBER = 'MEMBER'
}

export type MergeAccountsResponse = {
  __typename?: 'MergeAccountsResponse';
  /** The resulting account */
  account: Account;
  /** A message to display to the user about the result */
  message?: Maybe<Scalars['String']>;
};

/** This is the root mutation */
export type Mutation = {
  __typename?: 'Mutation';
  /** Add a new payment method to be used with an Order. Scope: "orders". */
  addCreditCard: CreditCardWithStripeError;
  /** Add an emoji reaction. Scope: "conversations", "expenses" or "updates". */
  addEmojiReaction: EmojiReactionResponse;
  /** Add funds to the given account. Scope: "host". */
  addFunds: Order;
  /**
   * Add platform tips to a transaction. Scope: "transactions".
   * @deprecated 2022-07-06: This feature will not be supported in the future. Please don't rely on it.
   */
  addPlatformTipToTransaction: Transaction;
  /** Add 2FA to the Individual if it does not have it. Scope: "account". */
  addTwoFactorAuthTokenToIndividual: AddTwoFactorAuthTokenToIndividualResponse;
  /** Apply to an host with a collective. Scope: "account". */
  applyToHost: Account;
  /** Assign Virtual Card information to existing hosted collective. Scope: "virtualCards". */
  assignNewVirtualCard: VirtualCard;
  /** [Root only] Ban accounts */
  banAccount: BanAccountResponse;
  /** Cancel an order. Scope: "orders". */
  cancelOrder?: Maybe<Order>;
  /** [Root only] Clears the cache for a given account */
  clearCacheForAccount: Account;
  /** Confirm a credit card is ready for use after strong customer authentication. Scope: "orders". */
  confirmCreditCard: CreditCardWithStripeError;
  /** Mark an account as confirmed */
  confirmGuestAccount: ConfirmGuestAccountResponse;
  /** Confirm an order (strong customer authentication). Scope: "orders". */
  confirmOrder: OrderWithPayment;
  createApplication?: Maybe<Application>;
  /** Create a Collective. Scope: "account". */
  createCollective?: Maybe<Collective>;
  /** Create a comment. Scope: "conversations", "expenses" or "updates". */
  createComment?: Maybe<Comment>;
  /** Connect external account to Open Collective Account. Scope: "connectedAccounts". */
  createConnectedAccount?: Maybe<ConnectedAccount>;
  /** Create a conversation. Scope: "conversations". */
  createConversation?: Maybe<Conversation>;
  /** Create an Event. Scope: "account". */
  createEvent?: Maybe<Event>;
  /** Submit an expense to a collective. Scope: "expenses". */
  createExpense: Expense;
  /** Create a Fund. Scope: "account". */
  createFund?: Maybe<Fund>;
  /** [Root only] Create a member entry directly. For non-root users, use `inviteMember` */
  createMember: Member;
  /** To submit a new order. Scope: "orders". */
  createOrder: OrderWithPayment;
  /** Create an Organization. Scope: "account". */
  createOrganization?: Maybe<Organization>;
  /** Creates a Stripe payment intent */
  createPaymentIntent: PaymentIntent;
  /** Create a new Payout Method to get paid through the platform. Scope: "expenses". */
  createPayoutMethod?: Maybe<PayoutMethod>;
  /** To submit a new order. Scope: "orders". */
  createPendingOrder: Order;
  createPersonalToken?: Maybe<PersonalToken>;
  /** Create a Project. Scope: "account". */
  createProject?: Maybe<Project>;
  /** Create a tier. */
  createTier: Tier;
  /** Create update. Scope: "updates". */
  createUpdate: Update;
  /** Create new Stripe Virtual Card for existing hosted collective. Scope: "virtualCards". */
  createVirtualCard: VirtualCard;
  /** Create webhook. Scope: "webhooks". */
  createWebhook?: Maybe<Webhook>;
  /** Adds or removes a policy on a given account. Scope: "account". */
  deleteAccount?: Maybe<Account>;
  deleteApplication?: Maybe<Application>;
  deleteComment?: Maybe<Comment>;
  /** Delete ConnectedAccount. Scope: "connectedAccounts". */
  deleteConnectedAccount?: Maybe<ConnectedAccount>;
  /** Delete an expense. Only work if the expense is rejected - please check permissions.canDelete. Scope: "expenses". */
  deleteExpense: Expense;
  deletePersonalToken?: Maybe<PersonalToken>;
  /** Delete a tier. */
  deleteTier: Tier;
  /** Delete update. Scope: "updates". */
  deleteUpdate: Update;
  /** Delete Virtual Card. Scope: "virtualCards". */
  deleteVirtualCard?: Maybe<Scalars['Boolean']>;
  /** Delete webhook. Scope: "webhooks". */
  deleteWebhook?: Maybe<Webhook>;
  /** Persist an Expense as a draft and invite someone to edit and submit it. Scope: "expenses". */
  draftExpenseAndInviteUser: Expense;
  /** Edit key properties of an account. Scope: "account". */
  editAccount: Host;
  /** An endpoint for hosts to edit the fees structure of their hosted accounts. Scope: "host". */
  editAccountFeeStructure: Account;
  /** [Root only] Edits account flags (deleted, banned, archived, trusted host) */
  editAccountFlags: Account;
  /** An endpoint for hosts to edit the freeze status of their hosted accounts. Scope: "host". */
  editAccountFreezeStatus: Account;
  /** Edit the settings for the given account. Scope: "account" or "host". */
  editAccountSetting: Account;
  /** Edit a comment. Scope: "conversations", "expenses" or "updates". */
  editComment?: Maybe<Comment>;
  /** Edit a conversation. Scope: "conversations". */
  editConversation?: Maybe<Conversation>;
  /** To update an existing expense */
  editExpense: Expense;
  /** Edit an existing member of the Collective. Scope: "account". */
  editMember: Member;
  /** Edit an existing member invitation of the Collective. Scope: "account". */
  editMemberInvitation?: Maybe<MemberInvitation>;
  /** To edit a pending order. Scope: "orders". */
  editPendingOrder: Order;
  /** Edit the public message for the given Member of a Collective. Scope: "account". */
  editPublicMessage: Member;
  /** Edit a tier. */
  editTier: Tier;
  /** Edit update. Scope: "updates". */
  editUpdate: Update;
  /** Edit existing Virtual Card information. Scope: "virtualCards". */
  editVirtualCard: VirtualCard;
  /** Returns true if user is following, false otherwise. Must be authenticated. Scope: "conversations". */
  followConversation?: Maybe<Scalars['Boolean']>;
  /** Invite a new member to the Collective. Scope: "account". */
  inviteMember: MemberInvitation;
  /** [Root only] Merge two accounts, returns the result account */
  mergeAccounts: MergeAccountsResponse;
  /** [Root only] A mutation to move expenses from one account to another */
  moveExpenses: Array<Maybe<Expense>>;
  /** [Root only] A mutation to move orders from one account to another */
  moveOrders: Array<Maybe<Order>>;
  /** Pause active Virtual Card. Scope: "virtualCards". */
  pauseVirtualCard: VirtualCard;
  /** Process the expense with the given action. Scope: "expenses". */
  processExpense: Expense;
  /** Reply to a host application. Scope: "host". */
  processHostApplication: ProcessHostApplicationResponse;
  /** A mutation for the host to approve or reject an order. Scope: "orders". */
  processPendingOrder: Order;
  /** Publish update. Scope: "updates". */
  publishUpdate: Update;
  /** Refunds a transaction. Scope: "transactions". */
  refundTransaction?: Maybe<Transaction>;
  /** Rejects transaction, removes member from Collective, and sends a message to the contributor. Scope: "transactions". */
  rejectTransaction: Transaction;
  /** Remove an emoji reaction. Scope: "conversations", "expenses" or "updates". */
  removeEmojiReaction: EmojiReactionResponse;
  /** Removes the host for an account */
  removeHost: Account;
  /** Remove a member from the Collective. Scope: "account". */
  removeMember?: Maybe<Scalars['Boolean']>;
  /** Remove the given payout method. Scope: "expenses". */
  removePayoutMethod: PayoutMethod;
  /** Remove 2FA from the Individual if it has been enabled. Scope: "account". */
  removeTwoFactorAuthTokenFromIndividual: Individual;
  /** Endpoint to accept or reject an invitation to become a member. Scope: "account". */
  replyToMemberInvitation: Scalars['Boolean'];
  /** Request Virtual Card to host. Scope: "virtualCards". */
  requestVirtualCard?: Maybe<Scalars['Boolean']>;
  /** To re-send the invitation to complete a draft expense. Scope: "expenses". */
  resendDraftExpenseInvite: Expense;
  /** Resume paused Virtual Card. Scope: "virtualCards". */
  resumeVirtualCard: VirtualCard;
  /** Revoke an OAuth authorization. Scope: "account". */
  revokeOAuthAuthorization: OAuthAuthorization;
  /** Sends an email for guest to confirm their emails and create their Open Collective account */
  sendGuestConfirmationEmail: Scalars['Boolean'];
  /** Send a message to an account. Scope: "account" */
  sendMessage?: Maybe<SendMessageResult>;
  /** Update the time which the user viewed the changelog updates. Scope: "account". */
  setChangelogViewDate: Individual;
  /** Set email notification subscription for requesting logged-in user */
  setEmailNotification?: Maybe<ActivitySubscription>;
  /** Update newsletter opt-in preference. Scope: "account". */
  setNewsletterOptIn: Individual;
  /** Set password to Individual. Scope: "account". 2FA. */
  setPassword: SetPasswordResponse;
  /** Adds or removes a policy on a given account. Scope: "account". */
  setPolicies: Account;
  setTags: TagResponse;
  /** Unpublish update. Scope: "updates". */
  unpublishUpdate: Update;
  updateApplication?: Maybe<Application>;
  /** Update an Order's amount, tier, or payment method. Scope: "orders". */
  updateOrder?: Maybe<Order>;
  updatePersonalToken?: Maybe<PersonalToken>;
  /** Updates collective social links */
  updateSocialLinks: Array<SocialLink>;
  /** Update webhook. Scope: "webhooks". */
  updateWebhook?: Maybe<Webhook>;
  /** To verify and unverified expense. Scope: "expenses". */
  verifyExpense: Expense;
};


/** This is the root mutation */
export type MutationAddCreditCardArgs = {
  account: AccountReferenceInput;
  creditCardInfo: CreditCardCreateInput;
  isSavedForLater?: InputMaybe<Scalars['Boolean']>;
  name: Scalars['String'];
};


/** This is the root mutation */
export type MutationAddEmojiReactionArgs = {
  comment?: InputMaybe<CommentReferenceInput>;
  emoji: Scalars['String'];
  update?: InputMaybe<UpdateReferenceInput>;
};


/** This is the root mutation */
export type MutationAddFundsArgs = {
  account: AccountReferenceInput;
  amount: AmountInput;
  description: Scalars['String'];
  fromAccount: AccountReferenceInput;
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  invoiceTemplate?: InputMaybe<Scalars['String']>;
  memo?: InputMaybe<Scalars['String']>;
  processedAt?: InputMaybe<Scalars['DateTime']>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationAddPlatformTipToTransactionArgs = {
  amount: AmountInput;
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationAddTwoFactorAuthTokenToIndividualArgs = {
  account: AccountReferenceInput;
  token: Scalars['String'];
};


/** This is the root mutation */
export type MutationApplyToHostArgs = {
  applicationData?: InputMaybe<Scalars['JSON']>;
  collective: AccountReferenceInput;
  host: AccountReferenceInput;
  inviteMembers?: InputMaybe<Array<InputMaybe<InviteMemberInput>>>;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationAssignNewVirtualCardArgs = {
  account: AccountReferenceInput;
  assignee: AccountReferenceInput;
  virtualCard: VirtualCardInput;
};


/** This is the root mutation */
export type MutationBanAccountArgs = {
  account: Array<AccountReferenceInput>;
  dryRun: Scalars['Boolean'];
  includeAssociatedAccounts: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationCancelOrderArgs = {
  order: OrderReferenceInput;
  reason?: InputMaybe<Scalars['String']>;
  reasonCode?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationClearCacheForAccountArgs = {
  account: AccountReferenceInput;
  type?: Array<InputMaybe<AccountCacheType>>;
};


/** This is the root mutation */
export type MutationConfirmCreditCardArgs = {
  paymentMethod: PaymentMethodReferenceInput;
};


/** This is the root mutation */
export type MutationConfirmGuestAccountArgs = {
  email: Scalars['EmailAddress'];
  emailConfirmationToken: Scalars['String'];
};


/** This is the root mutation */
export type MutationConfirmOrderArgs = {
  guestToken?: InputMaybe<Scalars['String']>;
  order: OrderReferenceInput;
};


/** This is the root mutation */
export type MutationCreateApplicationArgs = {
  application: ApplicationCreateInput;
};


/** This is the root mutation */
export type MutationCreateCollectiveArgs = {
  applicationData?: InputMaybe<Scalars['JSON']>;
  automateApprovalWithGithub?: InputMaybe<Scalars['Boolean']>;
  collective: CollectiveCreateInput;
  host?: InputMaybe<AccountReferenceInput>;
  inviteMembers?: InputMaybe<Array<InputMaybe<InviteMemberInput>>>;
  message?: InputMaybe<Scalars['String']>;
  skipDefaultAdmin?: InputMaybe<Scalars['Boolean']>;
  testPayload?: InputMaybe<Scalars['JSON']>;
  user?: InputMaybe<IndividualCreateInput>;
};


/** This is the root mutation */
export type MutationCreateCommentArgs = {
  comment: CommentCreateInput;
};


/** This is the root mutation */
export type MutationCreateConnectedAccountArgs = {
  account: AccountReferenceInput;
  connectedAccount: ConnectedAccountCreateInput;
};


/** This is the root mutation */
export type MutationCreateConversationArgs = {
  CollectiveId: Scalars['String'];
  html: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title: Scalars['String'];
};


/** This is the root mutation */
export type MutationCreateEventArgs = {
  account: AccountReferenceInput;
  event: EventCreateInput;
};


/** This is the root mutation */
export type MutationCreateExpenseArgs = {
  account: AccountReferenceInput;
  expense: ExpenseCreateInput;
  recurring?: InputMaybe<RecurringExpenseInput>;
};


/** This is the root mutation */
export type MutationCreateFundArgs = {
  fund: FundCreateInput;
  host?: InputMaybe<AccountReferenceInput>;
};


/** This is the root mutation */
export type MutationCreateMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationCreateOrderArgs = {
  order: OrderCreateInput;
};


/** This is the root mutation */
export type MutationCreateOrganizationArgs = {
  inviteMembers?: InputMaybe<Array<InputMaybe<InviteMemberInput>>>;
  organization: OrganizationCreateInput;
};


/** This is the root mutation */
export type MutationCreatePaymentIntentArgs = {
  paymentIntent: PaymentIntentInput;
};


/** This is the root mutation */
export type MutationCreatePayoutMethodArgs = {
  account: AccountReferenceInput;
  payoutMethod: PayoutMethodInput;
};


/** This is the root mutation */
export type MutationCreatePendingOrderArgs = {
  order: PendingOrderCreateInput;
};


/** This is the root mutation */
export type MutationCreatePersonalTokenArgs = {
  personalToken: PersonalTokenCreateInput;
};


/** This is the root mutation */
export type MutationCreateProjectArgs = {
  parent?: InputMaybe<AccountReferenceInput>;
  project: ProjectCreateInput;
};


/** This is the root mutation */
export type MutationCreateTierArgs = {
  account: AccountReferenceInput;
  tier: TierCreateInput;
};


/** This is the root mutation */
export type MutationCreateUpdateArgs = {
  update: UpdateCreateInput;
};


/** This is the root mutation */
export type MutationCreateVirtualCardArgs = {
  account: AccountReferenceInput;
  assignee: AccountReferenceInput;
  limitAmount: AmountInput;
  limitInterval: VirtualCardLimitInterval;
  name: Scalars['String'];
};


/** This is the root mutation */
export type MutationCreateWebhookArgs = {
  webhook: WebhookCreateInput;
};


/** This is the root mutation */
export type MutationDeleteAccountArgs = {
  account: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteApplicationArgs = {
  application: ApplicationReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteCommentArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationDeleteConnectedAccountArgs = {
  connectedAccount: ConnectedAccountReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteExpenseArgs = {
  expense: ExpenseReferenceInput;
};


/** This is the root mutation */
export type MutationDeletePersonalTokenArgs = {
  personalToken: PersonalTokenReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteTierArgs = {
  stopRecurringContributions?: Scalars['Boolean'];
  tier: TierReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteUpdateArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationDeleteVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationDeleteWebhookArgs = {
  webhook: WebhookReferenceInput;
};


/** This is the root mutation */
export type MutationDraftExpenseAndInviteUserArgs = {
  account: AccountReferenceInput;
  expense: ExpenseInviteDraftInput;
};


/** This is the root mutation */
export type MutationEditAccountArgs = {
  account: AccountUpdateInput;
};


/** This is the root mutation */
export type MutationEditAccountFeeStructureArgs = {
  account: AccountReferenceInput;
  hostFeePercent: Scalars['Float'];
  isCustomFee: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationEditAccountFlagsArgs = {
  account: AccountReferenceInput;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isTrustedHost?: InputMaybe<Scalars['Boolean']>;
  isTwoFactorAuthEnabled?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root mutation */
export type MutationEditAccountFreezeStatusArgs = {
  account: AccountReferenceInput;
  action: AccountFreezeAction;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationEditAccountSettingArgs = {
  account: AccountReferenceInput;
  key: Scalars['AccountSettingsKey'];
  value: Scalars['JSON'];
};


/** This is the root mutation */
export type MutationEditCommentArgs = {
  comment: CommentUpdateInput;
};


/** This is the root mutation */
export type MutationEditConversationArgs = {
  id: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  title: Scalars['String'];
};


/** This is the root mutation */
export type MutationEditExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense: ExpenseUpdateInput;
};


/** This is the root mutation */
export type MutationEditMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role?: InputMaybe<MemberRole>;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationEditMemberInvitationArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role?: InputMaybe<MemberRole>;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationEditPendingOrderArgs = {
  order: PendingOrderEditInput;
};


/** This is the root mutation */
export type MutationEditPublicMessageArgs = {
  fromAccount: AccountReferenceInput;
  message?: InputMaybe<Scalars['String']>;
  toAccount: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationEditTierArgs = {
  tier: TierUpdateInput;
};


/** This is the root mutation */
export type MutationEditUpdateArgs = {
  update: UpdateUpdateInput;
};


/** This is the root mutation */
export type MutationEditVirtualCardArgs = {
  assignee?: InputMaybe<AccountReferenceInput>;
  limitAmount?: InputMaybe<AmountInput>;
  limitInterval?: InputMaybe<VirtualCardLimitInterval>;
  name?: InputMaybe<Scalars['String']>;
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationFollowConversationArgs = {
  id: Scalars['String'];
  isActive?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root mutation */
export type MutationInviteMemberArgs = {
  account: AccountReferenceInput;
  description?: InputMaybe<Scalars['String']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
  since?: InputMaybe<Scalars['DateTime']>;
};


/** This is the root mutation */
export type MutationMergeAccountsArgs = {
  dryRun?: Scalars['Boolean'];
  fromAccount: AccountReferenceInput;
  toAccount: AccountReferenceInput;
};


/** This is the root mutation */
export type MutationMoveExpensesArgs = {
  destinationAccount: AccountReferenceInput;
  expenses: Array<ExpenseReferenceInput>;
};


/** This is the root mutation */
export type MutationMoveOrdersArgs = {
  fromAccount?: InputMaybe<AccountReferenceInput>;
  makeIncognito?: InputMaybe<Scalars['Boolean']>;
  orders: Array<OrderReferenceInput>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationPauseVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationProcessExpenseArgs = {
  action: ExpenseProcessAction;
  expense: ExpenseReferenceInput;
  message?: InputMaybe<Scalars['String']>;
  paymentParams?: InputMaybe<ProcessExpensePaymentParams>;
};


/** This is the root mutation */
export type MutationProcessHostApplicationArgs = {
  account: AccountReferenceInput;
  action: ProcessHostApplicationAction;
  host: AccountReferenceInput;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationProcessPendingOrderArgs = {
  action: ProcessOrderAction;
  order: OrderUpdateInput;
};


/** This is the root mutation */
export type MutationPublishUpdateArgs = {
  id: Scalars['String'];
  notificationAudience?: InputMaybe<UpdateAudience>;
};


/** This is the root mutation */
export type MutationRefundTransactionArgs = {
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationRejectTransactionArgs = {
  message?: InputMaybe<Scalars['String']>;
  transaction: TransactionReferenceInput;
};


/** This is the root mutation */
export type MutationRemoveEmojiReactionArgs = {
  comment?: InputMaybe<CommentReferenceInput>;
  emoji: Scalars['String'];
  update?: InputMaybe<UpdateReferenceInput>;
};


/** This is the root mutation */
export type MutationRemoveHostArgs = {
  account: AccountReferenceInput;
  message?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationRemoveMemberArgs = {
  account: AccountReferenceInput;
  isInvitation?: InputMaybe<Scalars['Boolean']>;
  memberAccount: AccountReferenceInput;
  role: MemberRole;
};


/** This is the root mutation */
export type MutationRemovePayoutMethodArgs = {
  payoutMethodId: Scalars['String'];
};


/** This is the root mutation */
export type MutationRemoveTwoFactorAuthTokenFromIndividualArgs = {
  account: AccountReferenceInput;
  code: Scalars['String'];
};


/** This is the root mutation */
export type MutationReplyToMemberInvitationArgs = {
  accept: Scalars['Boolean'];
  invitation: MemberInvitationReferenceInput;
};


/** This is the root mutation */
export type MutationRequestVirtualCardArgs = {
  account: AccountReferenceInput;
  budget?: InputMaybe<Scalars['Int']>;
  notes?: InputMaybe<Scalars['String']>;
  purpose?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationResendDraftExpenseInviteArgs = {
  expense: ExpenseReferenceInput;
};


/** This is the root mutation */
export type MutationResumeVirtualCardArgs = {
  virtualCard: VirtualCardReferenceInput;
};


/** This is the root mutation */
export type MutationRevokeOAuthAuthorizationArgs = {
  oAuthAuthorization: OAuthAuthorizationReferenceInput;
};


/** This is the root mutation */
export type MutationSendGuestConfirmationEmailArgs = {
  email: Scalars['EmailAddress'];
};


/** This is the root mutation */
export type MutationSendMessageArgs = {
  account: AccountReferenceInput;
  message: Scalars['NonEmptyString'];
  subject?: InputMaybe<Scalars['String']>;
};


/** This is the root mutation */
export type MutationSetChangelogViewDateArgs = {
  changelogViewDate: Scalars['DateTime'];
};


/** This is the root mutation */
export type MutationSetEmailNotificationArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  active: Scalars['Boolean'];
  type: ActivityAndClassesType;
};


/** This is the root mutation */
export type MutationSetNewsletterOptInArgs = {
  newsletterOptIn: Scalars['Boolean'];
};


/** This is the root mutation */
export type MutationSetPasswordArgs = {
  currentPassword?: InputMaybe<Scalars['String']>;
  password: Scalars['String'];
};


/** This is the root mutation */
export type MutationSetPoliciesArgs = {
  account: AccountReferenceInput;
  policies: PoliciesInput;
};


/** This is the root mutation */
export type MutationSetTagsArgs = {
  expense?: InputMaybe<ExpenseReferenceInput>;
  order?: InputMaybe<OrderReferenceInput>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


/** This is the root mutation */
export type MutationUnpublishUpdateArgs = {
  id: Scalars['String'];
};


/** This is the root mutation */
export type MutationUpdateApplicationArgs = {
  application: ApplicationUpdateInput;
};


/** This is the root mutation */
export type MutationUpdateOrderArgs = {
  amount?: InputMaybe<AmountInput>;
  order: OrderReferenceInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  paypalSubscriptionId?: InputMaybe<Scalars['String']>;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root mutation */
export type MutationUpdatePersonalTokenArgs = {
  personalToken: PersonalTokenUpdateInput;
};


/** This is the root mutation */
export type MutationUpdateSocialLinksArgs = {
  account: AccountReferenceInput;
  socialLinks: Array<SocialLinkInput>;
};


/** This is the root mutation */
export type MutationUpdateWebhookArgs = {
  webhook: WebhookUpdateInput;
};


/** This is the root mutation */
export type MutationVerifyExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense: ExpenseReferenceInput;
};

export type NewAccountOrReferenceInput = {
  email?: InputMaybe<Scalars['String']>;
  /** The public id identifying the account (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /**
   * The internal id of the account (ie: 580)
   * @deprecated 2020-01-01: should only be used during the transition to GraphQL API v2.
   */
  legacyId?: InputMaybe<Scalars['Int']>;
  legalName?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  newsletterOptIn?: InputMaybe<Scalars['Boolean']>;
  organization?: InputMaybe<NewAccountOrganizationInput>;
  /** The slug identifying the account (ie: babel for https://opencollective.com/babel) */
  slug?: InputMaybe<Scalars['String']>;
};

export type NewAccountOrganizationInput = {
  description?: InputMaybe<Scalars['String']>;
  legalName?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

/** A collection of "Application" */
export type OAuthApplicationCollection = Collection & {
  __typename?: 'OAuthApplicationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Application>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** An OAuth authorization */
export type OAuthAuthorization = {
  __typename?: 'OAuthAuthorization';
  account: Individual;
  application: Application;
  /** The time of creation */
  createdAt: Scalars['DateTime'];
  /** The time of expiration */
  expiresAt: Scalars['DateTime'];
  id?: Maybe<Scalars['String']>;
  /** The last time of token was used */
  lastUsedAt?: Maybe<Scalars['DateTime']>;
  /** The attached scopes. */
  scope?: Maybe<Array<Maybe<OAuthScope>>>;
  /** The time of last update */
  updatedAt: Scalars['DateTime'];
};

/** A collection of "OAuth Authorizations" */
export type OAuthAuthorizationCollection = Collection & {
  __typename?: 'OAuthAuthorizationCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<OAuthAuthorization>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type OAuthAuthorizationReferenceInput = {
  /** The id identifying the OAuth Authorization (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
};

/** All supported OAuth scopes */
export enum OAuthScope {
  /** Manage your account, collectives and organizations. */
  account = 'account',
  /** Create and manage OAuth applications. */
  applications = 'applications',
  /** Create and manage connected accounts. */
  connectedAccounts = 'connectedAccounts',
  /** Create and manage conversations. */
  conversations = 'conversations',
  /** Access your email address. */
  email = 'email',
  /** Create and manage expenses, payout methods. */
  expenses = 'expenses',
  /** Administrate fiscal hosts. */
  host = 'host',
  /** Access your incognito account. */
  incognito = 'incognito',
  /** Create and manage contributions, payment methods. */
  orders = 'orders',
  /** Perform critical administrative operations. */
  root = 'root',
  /** Refund and reject recorded transactions. */
  transactions = 'transactions',
  /** Create and manage updates. */
  updates = 'updates',
  /** Create and manage virtual cards. */
  virtualCards = 'virtualCards',
  /** Create and manage webhooks */
  webhooks = 'webhooks'
}

/** Order model */
export type Order = {
  __typename?: 'Order';
  /** Base order amount (without platform tip) */
  amount: Amount;
  createdAt?: Maybe<Scalars['DateTime']>;
  /** The account who created this order */
  createdByAccount?: Maybe<Account>;
  /** Custom data related to the order, based on the fields described by tier.customFields. Must be authenticated as an admin of the fromAccount or toAccount (returns null otherwise) */
  customData?: Maybe<Scalars['JSON']>;
  /** Data related to the order */
  data?: Maybe<Scalars['JSON']>;
  description?: Maybe<Scalars['String']>;
  frequency?: Maybe<ContributionFrequency>;
  fromAccount?: Maybe<Account>;
  /** Host fee percent attached to the Order. */
  hostFeePercent?: Maybe<Scalars['Float']>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  /** This represents a MemberOf relationship (ie: Collective backed by an Individual) attached to the Order. */
  membership?: Maybe<MemberOf>;
  /** Memo field which adds additional details about the order. For example in added funds this can be a note to mark what method (cheque, money order) the funds were received. */
  memo?: Maybe<Scalars['String']>;
  /** Whether the order needs confirmation (3DSecure/SCA) */
  needsConfirmation?: Maybe<Scalars['Boolean']>;
  nextChargeDate?: Maybe<Scalars['DateTime']>;
  paymentMethod?: Maybe<PaymentMethod>;
  /** Data about the pending contribution */
  pendingContributionData?: Maybe<PendingOrderData>;
  /** The permissions given to current logged in user for this order */
  permissions: OrderPermissions;
  /** Platform Tip attached to the Order. */
  platformTipAmount?: Maybe<Amount>;
  platformTipEligible?: Maybe<Scalars['Boolean']>;
  /** Date the funds were received. */
  processedAt?: Maybe<Scalars['DateTime']>;
  quantity?: Maybe<Scalars['Int']>;
  status?: Maybe<OrderStatus>;
  tags: Array<Maybe<Scalars['String']>>;
  taxes: Array<Maybe<OrderTax>>;
  tier?: Maybe<Tier>;
  toAccount?: Maybe<Account>;
  /** Total order amount, including all taxes and platform tip */
  totalAmount: Amount;
  /** WARNING: Total amount donated between collectives, though there will be edge cases especially when looking on the Order level, as the order id is not used in calculating this. */
  totalDonations: Amount;
  /** Transactions for this order ordered by createdAt ASC */
  transactions: Array<Maybe<Transaction>>;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** Possible fields you can use to order by */
export enum OrderByFieldType {
  /** The financial activity of the collective (number of transactions) */
  ACTIVITY = 'ACTIVITY',
  CREATED_AT = 'CREATED_AT',
  MEMBER_COUNT = 'MEMBER_COUNT',
  RANK = 'RANK',
  TOTAL_CONTRIBUTED = 'TOTAL_CONTRIBUTED'
}

/** Input to order results */
export type OrderByInput = {
  /** Ordering direction. */
  direction: OrderDirection;
  /** Field to order by. */
  field: OrderByFieldType;
};

/** A collection of "Orders" */
export type OrderCollection = Collection & {
  __typename?: 'OrderCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Order>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Some context about how an order was created */
export type OrderContextInput = {
  /** Whether this order was created using the embedded contribution flow */
  isEmbed?: InputMaybe<Scalars['Boolean']>;
};

/** Input to create a new order */
export type OrderCreateInput = {
  /** The contribution amount for 1 quantity, without platform contribution and taxes */
  amount: AmountInput;
  /** Some context about how this order was created */
  context?: InputMaybe<OrderContextInput>;
  /** If the tier has some "customFields", use this field to set their values */
  customData?: InputMaybe<Scalars['JSON']>;
  /** Data related to this order */
  data?: InputMaybe<Scalars['JSON']>;
  frequency: ContributionFrequency;
  /** The profile making the order. Can be null for guest contributions. */
  fromAccount?: InputMaybe<AccountReferenceInput>;
  /** Additional information about the contributing profile */
  fromAccountInfo?: InputMaybe<OrderFromAccountInfo>;
  /** Use this when fromAccount is null to pass the guest info */
  guestInfo?: InputMaybe<GuestInfoInput>;
  /** Whether this is transferring the remaining balance from a project/event/collective */
  isBalanceTransfer?: InputMaybe<Scalars['Boolean']>;
  /** The payment method used for this order */
  paymentMethod?: InputMaybe<PaymentMethodInput>;
  /** Platform tip attached to this order */
  platformTipAmount?: InputMaybe<AmountInput>;
  quantity?: Scalars['Int'];
  /** Tags associated to the order */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** Use this field to set the taxes associated to this order */
  taxes?: InputMaybe<Array<InputMaybe<OrderTaxInput>>>;
  /** The tier you are contributing to */
  tier?: InputMaybe<TierReferenceInput>;
  /** The profile you want to contribute to */
  toAccount: AccountReferenceInput;
};

/** Possible directions in which to order a list of items */
export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

/** Some context about how an order was created */
export type OrderFromAccountInfo = {
  email?: InputMaybe<Scalars['String']>;
  legalName?: InputMaybe<Scalars['String']>;
  /** The location of the contributor. Account location will be updated with this address if different from the existing one. */
  location?: InputMaybe<LocationInput>;
  name?: InputMaybe<Scalars['String']>;
};

/** Fields for the user permissions on an order */
export type OrderPermissions = {
  __typename?: 'OrderPermissions';
  /** Whether the current user edit this pending order */
  canEdit: Scalars['Boolean'];
  /** Whether the current user can mark this order as expired */
  canMarkAsExpired: Scalars['Boolean'];
  /** Whether the current user can mark this order as unpaid */
  canMarkAsPaid: Scalars['Boolean'];
  id: Scalars['String'];
};

export type OrderReferenceInput = {
  /** The public id identifying the order (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the order (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** All order statuses */
export enum OrderStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  ERROR = 'ERROR',
  EXPIRED = 'EXPIRED',
  IN_REVIEW = 'IN_REVIEW',
  NEW = 'NEW',
  PAID = 'PAID',
  PENDING = 'PENDING',
  PLEDGED = 'PLEDGED',
  PROCESSING = 'PROCESSING',
  REFUNDED = 'REFUNDED',
  REJECTED = 'REJECTED',
  REQUIRE_CLIENT_CONFIRMATION = 'REQUIRE_CLIENT_CONFIRMATION'
}

export type OrderTax = {
  __typename?: 'OrderTax';
  percentage: Scalars['Int'];
  type: OrderTaxType;
};

/** Input to set taxes for an order */
export type OrderTaxInput = {
  amount: AmountInput;
  /** Country of the account ordering, to know from where to apply the tax */
  country?: InputMaybe<CountryIso>;
  /** Tax identification number, if any */
  idNumber?: InputMaybe<Scalars['String']>;
  type: OrderTaxType;
};

/** The type of a tax like GST, VAT, etc */
export enum OrderTaxType {
  /** New Zealand Good and Services Tax */
  GST = 'GST',
  /** European Value Added Tax */
  VAT = 'VAT'
}

export type OrderUpdateInput = {
  /** Amount received by collective, excluding any tips or fees */
  amount?: InputMaybe<AmountInput>;
  /** Host fee percent to be applied to the order */
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  /** The public id identifying the order (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the order (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  /** Amount paid in fees for the payment processor */
  paymentProcessorFee?: InputMaybe<AmountInput>;
  /** Amount intended as tip for the platform */
  platformTip?: InputMaybe<AmountInput>;
  /** Date the funds were received */
  processedAt?: InputMaybe<Scalars['DateTime']>;
};

export type OrderWithPayment = {
  __typename?: 'OrderWithPayment';
  /** If donating as a guest, this will contain your guest token to confirm your order */
  guestToken?: Maybe<Scalars['String']>;
  /** The order created */
  order: Order;
  /** This field will be set if the order was created but there was an error with Stripe during the payment */
  stripeError?: Maybe<StripeError>;
};

/** This represents an Organization account */
export type Organization = Account & AccountWithContributions & {
  __typename?: 'Organization';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** @deprecated 2022-07-18: This field is deprecated and will return null */
  email?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** If the organization if a host account, this will return the matching Host object */
  host?: Maybe<Host>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether the account accepts financial contributions. */
  isActive?: Maybe<Scalars['Boolean']>;
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /**
   *
   *           Address. This field is public for hosts, otherwise:
   *             - Users can see the addresses of the collectives they're admin of; if they are not an admin they can only see the country that the org belong to.
   *             - Hosts can see the address of organizations submitting expenses to their collectives.
   *
   */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Organization account */
export type OrganizationBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Organization account */
export type OrganizationChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Organization account */
export type OrganizationMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Organization account */
export type OrganizationOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Organization account */
export type OrganizationTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Organization account */
export type OrganizationTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Organization account */
export type OrganizationUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Organization account */
export type OrganizationVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Organization account */
export type OrganizationWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type OrganizationCreateInput = {
  description: Scalars['String'];
  legalName?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  website?: InputMaybe<Scalars['String']>;
};

/** A Stripe payment intent */
export type PaymentIntent = {
  __typename?: 'PaymentIntent';
  id: Scalars['String'];
  paymentIntentClientSecret: Scalars['String'];
  stripeAccount: Scalars['String'];
  stripeAccountPublishableSecret: Scalars['String'];
};

/** Input to create a Stripe payment intent */
export type PaymentIntentInput = {
  amount: AmountInput;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  toAccount: AccountReferenceInput;
};

/** PaymentMethod model */
export type PaymentMethod = {
  __typename?: 'PaymentMethod';
  account?: Maybe<Account>;
  /** Returns the balance amount and the currency of this paymentMethod */
  balance: Amount;
  createdAt?: Maybe<Scalars['DateTime']>;
  data?: Maybe<Scalars['JSON']>;
  expiryDate?: Maybe<Scalars['DateTime']>;
  id?: Maybe<Scalars['String']>;
  legacyId?: Maybe<Scalars['Int']>;
  limitedToHosts?: Maybe<Array<Maybe<Host>>>;
  /** For monthly gift cards, this field will return the monthly limit */
  monthlyLimit?: Maybe<Amount>;
  name?: Maybe<Scalars['String']>;
  /** Get all the orders associated with this payment method */
  orders?: Maybe<OrderCollection>;
  /**
   * Defines the type of the payment method. Meant to be moved to "type" in the future.
   * @deprecated 2021-03-02: Please use service + type
   */
  providerType?: Maybe<PaymentMethodLegacyType>;
  service?: Maybe<PaymentMethodService>;
  /** For gift cards, this field will return to the source payment method */
  sourcePaymentMethod?: Maybe<PaymentMethod>;
  type?: Maybe<PaymentMethodType>;
};


/** PaymentMethod model */
export type PaymentMethodOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};

/** An input to use for creating or retrieving payment methods */
export type PaymentMethodInput = {
  /** When creating a credit card, use this field to set its info */
  creditCardInfo?: InputMaybe<CreditCardCreateInput>;
  /** The id assigned to the payment method */
  id?: InputMaybe<Scalars['String']>;
  /** Whether this payment method should be saved for future payments */
  isSavedForLater?: InputMaybe<Scalars['Boolean']>;
  /**
   * Type of this payment method
   * @deprecated 2021-03-02: Please use service + type
   */
  legacyType?: InputMaybe<PaymentMethodLegacyType>;
  /** Name of this payment method */
  name?: InputMaybe<Scalars['String']>;
  /** @deprecated 2021-08-20: Please use type instead */
  newType?: InputMaybe<PaymentMethodType>;
  /** The Payment Intent ID used in this checkout */
  paymentIntentId?: InputMaybe<Scalars['String']>;
  /** To pass when type is PAYPAL */
  paypalInfo?: InputMaybe<PaypalPaymentInput>;
  /** Service of this payment method */
  service?: InputMaybe<PaymentMethodService>;
  /** Type of this payment method */
  type?: InputMaybe<PaymentMethodType>;
};

export enum PaymentMethodLegacyType {
  ACCOUNT_BALANCE = 'ACCOUNT_BALANCE',
  ADDED_FUNDS = 'ADDED_FUNDS',
  ALIPAY = 'ALIPAY',
  BACS_DEBIT = 'BACS_DEBIT',
  BANCONTACT = 'BANCONTACT',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  CRYPTO = 'CRYPTO',
  GIFT_CARD = 'GIFT_CARD',
  PAYMENT_INTENT = 'PAYMENT_INTENT',
  PAYPAL = 'PAYPAL',
  PREPAID_BUDGET = 'PREPAID_BUDGET',
  SEPA_DEBIT = 'SEPA_DEBIT',
  US_BANK_ACCOUNT = 'US_BANK_ACCOUNT'
}

export type PaymentMethodReferenceInput = {
  /** The id assigned to the payment method */
  id?: InputMaybe<Scalars['String']>;
};

export enum PaymentMethodService {
  OPENCOLLECTIVE = 'OPENCOLLECTIVE',
  PAYPAL = 'PAYPAL',
  PREPAID = 'PREPAID',
  STRIPE = 'STRIPE',
  THEGIVINGBLOCK = 'THEGIVINGBLOCK'
}

export enum PaymentMethodType {
  ADAPTIVE = 'ADAPTIVE',
  ALIPAY = 'ALIPAY',
  BACS_DEBIT = 'BACS_DEBIT',
  BANCONTACT = 'BANCONTACT',
  COLLECTIVE = 'COLLECTIVE',
  CREDITCARD = 'CREDITCARD',
  CRYPTO = 'CRYPTO',
  GIFTCARD = 'GIFTCARD',
  HOST = 'HOST',
  MANUAL = 'MANUAL',
  PAYMENT = 'PAYMENT',
  PAYMENT_INTENT = 'PAYMENT_INTENT',
  PREPAID = 'PREPAID',
  SEPA_DEBIT = 'SEPA_DEBIT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  US_BANK_ACCOUNT = 'US_BANK_ACCOUNT',
  /** @deprecated Please use uppercase values */
  adaptive = 'adaptive',
  /** @deprecated Please use uppercase values */
  alipay = 'alipay',
  /** @deprecated Please use uppercase values */
  bacs_debit = 'bacs_debit',
  /** @deprecated Please use uppercase values */
  bancontact = 'bancontact',
  /** @deprecated Please use uppercase values */
  collective = 'collective',
  /** @deprecated Please use uppercase values */
  creditcard = 'creditcard',
  /** @deprecated Please use uppercase values */
  crypto = 'crypto',
  /** @deprecated Please use uppercase values */
  giftcard = 'giftcard',
  /** @deprecated Please use uppercase values */
  host = 'host',
  /** @deprecated Please use uppercase values */
  manual = 'manual',
  /** @deprecated Please use uppercase values */
  payment = 'payment',
  /** @deprecated Please use uppercase values */
  paymentintent = 'paymentintent',
  /** @deprecated Please use uppercase values */
  prepaid = 'prepaid',
  /** @deprecated Please use uppercase values */
  sepa_debit = 'sepa_debit',
  /** @deprecated Please use uppercase values */
  subscription = 'subscription',
  /** @deprecated Please use uppercase values */
  us_bank_account = 'us_bank_account'
}

/** A payout method */
export type PayoutMethod = {
  __typename?: 'PayoutMethod';
  /** The actual data for this payout method. Content depends on the type. */
  data?: Maybe<Scalars['JSON']>;
  /** Unique identifier for this payout method */
  id: Scalars['String'];
  /** Whether this payout method has been saved to be used for future payouts */
  isSaved?: Maybe<Scalars['Boolean']>;
  /** A friendly name for users to easily find their payout methods */
  name?: Maybe<Scalars['String']>;
  /** The type of this payout method (usually the payment provider) */
  type?: Maybe<PayoutMethodType>;
};

export type PayoutMethodInput = {
  data?: InputMaybe<Scalars['JSON']>;
  id?: InputMaybe<Scalars['String']>;
  isSaved?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<PayoutMethodType>;
};

export enum PayoutMethodType {
  ACCOUNT_BALANCE = 'ACCOUNT_BALANCE',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
  PAYPAL = 'PAYPAL'
}

export type PaypalPaymentInput = {
  data?: InputMaybe<Scalars['JSON']>;
  orderId?: InputMaybe<Scalars['String']>;
  subscriptionId?: InputMaybe<Scalars['String']>;
  token?: InputMaybe<Scalars['String']>;
};

/** A PayPal plan to associate with a contribution */
export type PaypalPlan = {
  __typename?: 'PaypalPlan';
  id: Scalars['String'];
};

/** Input to create a new pending order */
export type PendingOrderCreateInput = {
  /** The contribution amount, without platform contribution and taxes */
  amount: AmountInput;
  /** Public order description */
  description?: InputMaybe<Scalars['String']>;
  /** When is the money expected? */
  expectedAt?: InputMaybe<Scalars['DateString']>;
  /** The profile making the contribution. */
  fromAccount: AccountReferenceInput;
  /** Additional information about the contributing profile */
  fromAccountInfo?: InputMaybe<OrderFromAccountInfo>;
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  /** Private memo for the host */
  memo?: InputMaybe<Scalars['String']>;
  /** Payment method expected for this order */
  paymentMethod?: InputMaybe<Scalars['String']>;
  /** Platform tip attached to this order */
  platformTipAmount?: InputMaybe<AmountInput>;
  /** External identifier for the order */
  ponumber?: InputMaybe<Scalars['String']>;
  /** Use this field to set the taxes associated to this order */
  taxes?: InputMaybe<Array<InputMaybe<OrderTaxInput>>>;
  /** The tier you are contributing to */
  tier?: InputMaybe<TierReferenceInput>;
  /** The collective you want to contribute to */
  toAccount: AccountReferenceInput;
};

export type PendingOrderData = {
  __typename?: 'PendingOrderData';
  expectedAt?: Maybe<Scalars['DateTime']>;
  fromAccountInfo?: Maybe<PendingOrderFromAccountInfo>;
  memo?: Maybe<Scalars['String']>;
  paymentMethod?: Maybe<Scalars['String']>;
  ponumber?: Maybe<Scalars['String']>;
};

/** Input to edit an existing pending order */
export type PendingOrderEditInput = {
  /** The contribution amount, without platform contribution and taxes */
  amount: AmountInput;
  /** Public order description */
  description?: InputMaybe<Scalars['String']>;
  /** When is the money expected? */
  expectedAt?: InputMaybe<Scalars['DateString']>;
  /** The profile making the contribution. */
  fromAccount?: InputMaybe<AccountReferenceInput>;
  /** Additional information about the contributing profile */
  fromAccountInfo?: InputMaybe<OrderFromAccountInfo>;
  hostFeePercent?: InputMaybe<Scalars['Float']>;
  /** The public id identifying the order (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the order (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  /** Private memo for the host */
  memo?: InputMaybe<Scalars['String']>;
  /** Payment method expected for this order */
  paymentMethod?: InputMaybe<Scalars['String']>;
  /** Platform tip attached to this order */
  platformTipAmount?: InputMaybe<AmountInput>;
  /** External identifier for the order */
  ponumber?: InputMaybe<Scalars['String']>;
  /** Use this field to set the taxes associated to this order */
  taxes?: InputMaybe<Array<InputMaybe<OrderTaxInput>>>;
  /** The tier you are contributing to */
  tier?: InputMaybe<TierReferenceInput>;
};

export type PendingOrderFromAccountInfo = {
  __typename?: 'PendingOrderFromAccountInfo';
  email?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type Permission = {
  __typename?: 'Permission';
  allowed: Scalars['Boolean'];
  reason?: Maybe<Scalars['String']>;
  reasonDetails?: Maybe<Scalars['JSON']>;
};

/** A personal token */
export type PersonalToken = {
  __typename?: 'PersonalToken';
  /** The account that owns this personal token */
  account: Individual;
  /** The date on which the personal token was created */
  createdAt?: Maybe<Scalars['DateTime']>;
  /** The date on which the personal token expires */
  expiresAt?: Maybe<Scalars['DateTime']>;
  /** Unique identifier for this personal token */
  id: Scalars['String'];
  /** A friendly name for users to easily find their personal tokens */
  name?: Maybe<Scalars['String']>;
  /** The scopes of the personal token */
  scope?: Maybe<Array<Maybe<OAuthScope>>>;
  /** The personal token */
  token?: Maybe<Scalars['String']>;
  /** The date on which the personal token was last updated */
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of "PersonalToken" */
export type PersonalTokenCollection = Collection & {
  __typename?: 'PersonalTokenCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<PersonalToken>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input type for PersonalToken */
export type PersonalTokenCreateInput = {
  /** The account to use as the owner of the application. Defaults to currently logged in user. */
  account?: InputMaybe<AccountReferenceInput>;
  expiresAt?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  scope?: InputMaybe<Array<InputMaybe<OAuthScope>>>;
};

export type PersonalTokenReferenceInput = {
  /** The public id identifying the personal-token (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the personal-token (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** Input type for PersonalToken */
export type PersonalTokenUpdateInput = {
  expiresAt?: InputMaybe<Scalars['String']>;
  /** The public id identifying the personal-token (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the personal-token (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  name?: InputMaybe<Scalars['String']>;
  scope?: InputMaybe<Array<InputMaybe<OAuthScope>>>;
};

export type Policies = {
  __typename?: 'Policies';
  COLLECTIVE_MINIMUM_ADMINS?: Maybe<Collective_Minimum_Admins>;
  EXPENSE_AUTHOR_CANNOT_APPROVE?: Maybe<Expense_Author_Cannot_Approve>;
  MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: Maybe<Maximum_Virtual_Card_Limit_Amount_For_Interval>;
  REQUIRE_2FA_FOR_ADMINS?: Maybe<Scalars['Boolean']>;
};

export type PoliciesCollectiveExpenseAuthorCannotApprove = {
  amountInCents?: InputMaybe<Scalars['Int']>;
  appliesToHostedCollectives?: InputMaybe<Scalars['Boolean']>;
  appliesToSingleAdminCollectives?: InputMaybe<Scalars['Boolean']>;
  enabled?: InputMaybe<Scalars['Boolean']>;
};

export type PoliciesCollectiveMinimumAdminsInput = {
  applies?: InputMaybe<PolicyApplication>;
  freeze?: InputMaybe<Scalars['Boolean']>;
  numberOfAdmins?: InputMaybe<Scalars['Int']>;
};

export type PoliciesInput = {
  COLLECTIVE_MINIMUM_ADMINS?: InputMaybe<PoliciesCollectiveMinimumAdminsInput>;
  EXPENSE_AUTHOR_CANNOT_APPROVE?: InputMaybe<PoliciesCollectiveExpenseAuthorCannotApprove>;
  REQUIRE_2FA_FOR_ADMINS?: InputMaybe<Scalars['Boolean']>;
};

/** Defines how the policy is applied */
export enum PolicyApplication {
  ALL_COLLECTIVES = 'ALL_COLLECTIVES',
  NEW_COLLECTIVES = 'NEW_COLLECTIVES'
}

/** Parameters for paying an expense */
export type ProcessExpensePaymentParams = {
  /** Who is responsible for paying any due fees. */
  feesPayer?: InputMaybe<FeesPayer>;
  /** Bypass automatic integrations (ie. PayPal, Transferwise) to process the expense manually */
  forceManual?: InputMaybe<Scalars['Boolean']>;
  /** The fee charged by payment processor in host currency */
  paymentProcessorFeeInHostCurrency?: InputMaybe<Scalars['Int']>;
  /** Whether the payment processor fees should be refunded when triggering MARK_AS_UNPAID */
  shouldRefundPaymentProcessorFee?: InputMaybe<Scalars['Boolean']>;
  /** The total amount paid in host currency */
  totalAmountPaidInHostCurrency?: InputMaybe<Scalars['Int']>;
};

/** Action taken for an account application to the host */
export enum ProcessHostApplicationAction {
  /** Approve the account request to be hosted */
  APPROVE = 'APPROVE',
  /** Rejects the account request to be hosted */
  REJECT = 'REJECT',
  /** Sends a private message to the admins of the account */
  SEND_PRIVATE_MESSAGE = 'SEND_PRIVATE_MESSAGE',
  /** Creates a public conversation */
  SEND_PUBLIC_MESSAGE = 'SEND_PUBLIC_MESSAGE'
}

export type ProcessHostApplicationResponse = {
  __typename?: 'ProcessHostApplicationResponse';
  /** The account that applied to the host */
  account: Account;
  /** When sending a public message, this field will have the info about the conversation created */
  conversation?: Maybe<Conversation>;
};

/** Action to apply on the order */
export enum ProcessOrderAction {
  /** To mark the order as expired */
  MARK_AS_EXPIRED = 'MARK_AS_EXPIRED',
  /** To mark the order as paid */
  MARK_AS_PAID = 'MARK_AS_PAID'
}

/** This represents an Project account */
export type Project = Account & AccountWithContributions & AccountWithHost & AccountWithParent & {
  __typename?: 'Project';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** The Account parenting this account */
  parent?: Maybe<Account>;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents an Project account */
export type ProjectBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type ProjectChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents an Project account */
export type ProjectImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents an Project account */
export type ProjectMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents an Project account */
export type ProjectOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents an Project account */
export type ProjectTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents an Project account */
export type ProjectTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents an Project account */
export type ProjectUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents an Project account */
export type ProjectVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents an Project account */
export type ProjectWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

export type ProjectCreateInput = {
  description: Scalars['String'];
  name: Scalars['String'];
  settings?: InputMaybe<Scalars['JSON']>;
  slug: Scalars['String'];
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

/** This is the root query */
export type Query = {
  __typename?: 'Query';
  account?: Maybe<Account>;
  accounts: AccountCollection;
  activities: ActivityCollection;
  application?: Maybe<Application>;
  collective?: Maybe<Collective>;
  conversation?: Maybe<Conversation>;
  event?: Maybe<Event>;
  expense?: Maybe<Expense>;
  expenses: ExpenseCollection;
  fund?: Maybe<Fund>;
  host?: Maybe<Host>;
  hosts?: Maybe<HostCollection>;
  individual?: Maybe<Individual>;
  loggedInAccount?: Maybe<Individual>;
  me?: Maybe<Individual>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  order?: Maybe<Order>;
  orders: OrderCollection;
  organization?: Maybe<Organization>;
  paypalPlan: PaypalPlan;
  /** Get a personal token by reference */
  personalToken?: Maybe<PersonalToken>;
  project?: Maybe<Project>;
  tagStats: TagStatsCollection;
  tier?: Maybe<Tier>;
  transactions: TransactionCollection;
  update?: Maybe<Update>;
  updates: UpdatesCollection;
};


/** This is the root query */
export type QueryAccountArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryAccountsArgs = {
  country?: InputMaybe<Array<InputMaybe<CountryIso>>>;
  hasCustomContributionsEnabled?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<Array<InputMaybe<AccountReferenceInput>>>;
  includeArchived?: InputMaybe<Scalars['Boolean']>;
  isActive?: InputMaybe<Scalars['Boolean']>;
  isHost?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<OrderByInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  skipRecentAccounts?: InputMaybe<Scalars['Boolean']>;
  supportedPaymentMethodService?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  tagSearchOperator?: TagSearchOperator;
  type?: InputMaybe<Array<InputMaybe<AccountType>>>;
};


/** This is the root query */
export type QueryActivitiesArgs = {
  account: Array<AccountReferenceInput>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  excludeParentAccount?: Scalars['Boolean'];
  includeChildrenAccounts?: Scalars['Boolean'];
  includeHostedAccounts?: Scalars['Boolean'];
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  type?: InputMaybe<Array<ActivityAndClassesType>>;
};


/** This is the root query */
export type QueryApplicationArgs = {
  clientId?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  legacyId?: InputMaybe<Scalars['Int']>;
};


/** This is the root query */
export type QueryCollectiveArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryConversationArgs = {
  id: Scalars['String'];
};


/** This is the root query */
export type QueryEventArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryExpenseArgs = {
  draftKey?: InputMaybe<Scalars['String']>;
  expense?: InputMaybe<ExpenseReferenceInput>;
  id?: InputMaybe<Scalars['String']>;
};


/** This is the root query */
export type QueryExpensesArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  createdByAccount?: InputMaybe<AccountReferenceInput>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenExpenses?: Scalars['Boolean'];
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  payoutMethodType?: InputMaybe<PayoutMethodType>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<ExpenseStatusFilter>;
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<ExpenseType>;
};


/** This is the root query */
export type QueryFundArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryHostArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryHostsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


/** This is the root query */
export type QueryIndividualArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This is the root query */
export type QueryOrderArgs = {
  order: OrderReferenceInput;
};


/** This is the root query */
export type QueryOrdersArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This is the root query */
export type QueryOrganizationArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryPaypalPlanArgs = {
  account: AccountReferenceInput;
  amount: AmountInput;
  frequency: ContributionFrequency;
  tier?: InputMaybe<TierReferenceInput>;
};


/** This is the root query */
export type QueryPersonalTokenArgs = {
  id?: InputMaybe<Scalars['String']>;
  legacyId?: InputMaybe<Scalars['Int']>;
};


/** This is the root query */
export type QueryProjectArgs = {
  githubHandle?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  throwIfMissing?: InputMaybe<Scalars['Boolean']>;
};


/** This is the root query */
export type QueryTagStatsArgs = {
  host?: InputMaybe<AccountReferenceInput>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  searchTerm?: InputMaybe<Scalars['String']>;
  tagSearchTerm?: InputMaybe<Scalars['String']>;
};


/** This is the root query */
export type QueryTierArgs = {
  throwIfMissing?: Scalars['Boolean'];
  tier: TierReferenceInput;
};


/** This is the root query */
export type QueryTransactionsArgs = {
  account?: InputMaybe<Array<AccountReferenceInput>>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This is the root query */
export type QueryUpdateArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  id?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
};


/** This is the root query */
export type QueryUpdatesArgs = {
  accountTag?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  host?: InputMaybe<Array<InputMaybe<AccountReferenceInput>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** A recurring expense object */
export type RecurringExpense = {
  __typename?: 'RecurringExpense';
  account: Account;
  /** The time this expense will cease to be recurring */
  endsAt?: Maybe<Scalars['DateTime']>;
  fromAccount: Account;
  /** Unique identifier for this recurring expense */
  id: Scalars['String'];
  /** The interval in which this recurring expense is created */
  interval: RecurringExpenseInterval;
  /** The last time this recurring expense was paid for */
  lastDraftedAt: Scalars['DateTime'];
  /** The last expense created by this recurring expense record paid for */
  lastExpenseCreated?: Maybe<Expense>;
};

export type RecurringExpenseInput = {
  /** The date when this recurring expense should cease */
  endsAt?: InputMaybe<Scalars['DateTime']>;
  /** The interval in which this recurring expense is created */
  interval: RecurringExpenseInterval;
};

/** All supported intervals for recurring expenses */
export enum RecurringExpenseInterval {
  day = 'day',
  month = 'month',
  quarter = 'quarter',
  week = 'week',
  year = 'year'
}

export type SecurityCheck = {
  __typename?: 'SecurityCheck';
  /** SecurityCheck details */
  details?: Maybe<Scalars['String']>;
  /** The SecurityCheck level */
  level: SecurityCheckLevel;
  /** SecurityCheck description message */
  message: Scalars['String'];
  /** The SecurityCheck scope */
  scope: SecurityCheckScope;
};

/** All supported SecurityCheck levels */
export enum SecurityCheckLevel {
  HIGH = 'HIGH',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  PASS = 'PASS'
}

/** All supported SecurityCheck scopes */
export enum SecurityCheckScope {
  COLLECTIVE = 'COLLECTIVE',
  PAYEE = 'PAYEE',
  PAYOUT_METHOD = 'PAYOUT_METHOD',
  USER = 'USER'
}

export type SendMessageResult = {
  __typename?: 'SendMessageResult';
  success?: Maybe<Scalars['Boolean']>;
};

export type SetPasswordResponse = {
  __typename?: 'SetPasswordResponse';
  individual: Individual;
  token?: Maybe<Scalars['String']>;
};

/** A social link */
export type SocialLink = {
  __typename?: 'SocialLink';
  createdAt?: Maybe<Scalars['DateTime']>;
  type: SocialLinkType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  url: Scalars['URL'];
};

export type SocialLinkInput = {
  type: SocialLinkType;
  url: Scalars['URL'];
};

/** The type of social link */
export enum SocialLinkType {
  DISCORD = 'DISCORD',
  DISCOURSE = 'DISCOURSE',
  FACEBOOK = 'FACEBOOK',
  GHOST = 'GHOST',
  GIT = 'GIT',
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  INSTAGRAM = 'INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  MASTODON = 'MASTODON',
  MATTERMOST = 'MATTERMOST',
  MEETUP = 'MEETUP',
  PEERTUBE = 'PEERTUBE',
  PIXELFED = 'PIXELFED',
  SLACK = 'SLACK',
  TIKTOK = 'TIKTOK',
  TUMBLR = 'TUMBLR',
  TWITTER = 'TWITTER',
  WEBSITE = 'WEBSITE',
  YOUTUBE = 'YOUTUBE'
}

export type StripeError = {
  __typename?: 'StripeError';
  account?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  response?: Maybe<Scalars['JSON']>;
};

export type TagResponse = {
  __typename?: 'TagResponse';
  expense?: Maybe<Expense>;
  order?: Maybe<Order>;
};

/** The operator to use when searching with tags */
export enum TagSearchOperator {
  AND = 'AND',
  OR = 'OR'
}

/** Statistics for a given tag */
export type TagStat = {
  __typename?: 'TagStat';
  /** Total amount for this tag */
  amount?: Maybe<Amount>;
  /** Number of entries for this tag */
  count: Scalars['Int'];
  /** An unique identifier for this tag */
  id: Scalars['String'];
  /** Name/Label of the tag */
  tag: Scalars['String'];
};

/** A collection of "Tags" */
export type TagStatsCollection = Collection & {
  __typename?: 'TagStatsCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<TagStat>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Information about a tax */
export type TaxInfo = {
  __typename?: 'TaxInfo';
  /** An unique identifier for this tax (GST, VAT, etc) */
  id: Scalars['String'];
  /** Tax ID number of the 3rd party receiving/paying the tax */
  idNumber?: Maybe<Scalars['String']>;
  /**
   * Percentage applied, between 0-100
   * @deprecated Please use `rate` instead
   */
  percentage: Scalars['Int'];
  /** Percentage applied, between 0-100 */
  rate: Scalars['Float'];
  /** Identifier for this tax (GST, VAT, etc) */
  type: OrderTaxType;
};

/** The type of a tax like GST, VAT, etc */
export enum TaxType {
  /** New Zealand Good and Services Tax */
  GST = 'GST',
  /** European Value Added Tax */
  VAT = 'VAT'
}

/** Tier model */
export type Tier = {
  __typename?: 'Tier';
  amount: Amount;
  amountType: TierAmountType;
  /** Number of tickets available. Returns null if there is no limit. */
  availableQuantity?: Maybe<Scalars['Int']>;
  button?: Maybe<Scalars['String']>;
  customFields?: Maybe<Scalars['JSON']>;
  description?: Maybe<Scalars['String']>;
  endsAt?: Maybe<Scalars['DateTime']>;
  frequency: TierFrequency;
  goal: Amount;
  id: Scalars['String'];
  /** @deprecated 2020-08-24: Please use "frequency" */
  interval?: Maybe<TierInterval>;
  invoiceTemplate?: Maybe<Scalars['String']>;
  legacyId: Scalars['Int'];
  maxQuantity?: Maybe<Scalars['Int']>;
  minimumAmount: Amount;
  name?: Maybe<Scalars['String']>;
  /** Get all orders */
  orders: OrderCollection;
  presets?: Maybe<Array<Maybe<Scalars['Int']>>>;
  singleTicket?: Maybe<Scalars['Boolean']>;
  slug?: Maybe<Scalars['String']>;
  type: TierType;
  useStandalonePage?: Maybe<Scalars['Boolean']>;
};


/** Tier model */
export type TierOrdersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
};

export enum TierAmountType {
  FIXED = 'FIXED',
  FLEXIBLE = 'FLEXIBLE'
}

/** A collection of "Tiers" */
export type TierCollection = Collection & {
  __typename?: 'TierCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Tier>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type TierCreateInput = {
  amount?: InputMaybe<AmountInput>;
  amountType: TierAmountType;
  button?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  frequency: TierFrequency;
  goal?: InputMaybe<AmountInput>;
  invoiceTemplate?: InputMaybe<Scalars['String']>;
  maxQuantity?: InputMaybe<Scalars['Int']>;
  minimumAmount?: InputMaybe<AmountInput>;
  name: Scalars['NonEmptyString'];
  presets?: InputMaybe<Array<Scalars['Int']>>;
  singleTicket?: InputMaybe<Scalars['Boolean']>;
  type: TierType;
  useStandalonePage?: InputMaybe<Scalars['Boolean']>;
};

export enum TierFrequency {
  FLEXIBLE = 'FLEXIBLE',
  MONTHLY = 'MONTHLY',
  ONETIME = 'ONETIME',
  YEARLY = 'YEARLY'
}

export enum TierInterval {
  flexible = 'flexible',
  month = 'month',
  year = 'year'
}

export type TierReferenceInput = {
  /** The id assigned to the Tier */
  id?: InputMaybe<Scalars['String']>;
  /** Pass this flag to reference the custom tier (/donate) */
  isCustom?: InputMaybe<Scalars['Boolean']>;
  /** The DB id assigned to the Tier */
  legacyId?: InputMaybe<Scalars['Int']>;
};

export enum TierType {
  DONATION = 'DONATION',
  MEMBERSHIP = 'MEMBERSHIP',
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  TICKET = 'TICKET',
  TIER = 'TIER'
}

export type TierUpdateInput = {
  amount?: InputMaybe<AmountInput>;
  amountType?: InputMaybe<TierAmountType>;
  button?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  frequency?: InputMaybe<TierFrequency>;
  goal?: InputMaybe<AmountInput>;
  /** The public id identifying the tier (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id: Scalars['String'];
  invoiceTemplate?: InputMaybe<Scalars['String']>;
  maxQuantity?: InputMaybe<Scalars['Int']>;
  minimumAmount?: InputMaybe<AmountInput>;
  name?: InputMaybe<Scalars['NonEmptyString']>;
  presets?: InputMaybe<Array<Scalars['Int']>>;
  singleTicket?: InputMaybe<Scalars['Boolean']>;
  type?: InputMaybe<TierType>;
  useStandalonePage?: InputMaybe<Scalars['Boolean']>;
};

export type TimeSeries = {
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

/** Amount time series */
export type TimeSeriesAmount = TimeSeries & {
  __typename?: 'TimeSeriesAmount';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountNode = {
  __typename?: 'TimeSeriesAmountNode';
  amount: Amount;
  date: Scalars['DateTime'];
  label?: Maybe<Scalars['String']>;
};

/** Amounts with settlements time series */
export type TimeSeriesAmountWithKind = TimeSeries & {
  __typename?: 'TimeSeriesAmountWithKind';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountWithKindNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountWithKindNode = {
  __typename?: 'TimeSeriesAmountWithKindNode';
  amount: Amount;
  date: Scalars['DateTime'];
  kind: TransactionKind;
};

/** Amounts with settlements time series */
export type TimeSeriesAmountWithSettlement = TimeSeries & {
  __typename?: 'TimeSeriesAmountWithSettlement';
  /** The start date of the time series */
  dateFrom: Scalars['DateTime'];
  /** The end date of the time series */
  dateTo: Scalars['DateTime'];
  /** Time series data points */
  nodes: Array<TimeSeriesAmountWithSettlementNode>;
  /** The interval between two data points */
  timeUnit: TimeUnit;
};

export type TimeSeriesAmountWithSettlementNode = {
  __typename?: 'TimeSeriesAmountWithSettlementNode';
  amount: Amount;
  date: Scalars['DateTime'];
  settlementStatus: TransactionSettlementStatus;
};

export enum TimeUnit {
  DAY = 'DAY',
  HOUR = 'HOUR',
  MINUTE = 'MINUTE',
  MONTH = 'MONTH',
  SECOND = 'SECOND',
  WEEK = 'WEEK',
  YEAR = 'YEAR'
}

/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type Transaction = {
  account?: Maybe<Account>;
  amount: Amount;
  amountInHostCurrency: Amount;
  /** The balance after the Transaction has run. Only for financially active accounts. */
  balanceInHostCurrency?: Maybe<Amount>;
  createdAt?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  expense?: Maybe<Expense>;
  /** The sender of a transaction (on CREDIT = oppositeAccount, DEBIT = account) */
  fromAccount?: Maybe<Account>;
  giftCardEmitterAccount?: Maybe<Account>;
  group: Scalars['String'];
  host?: Maybe<Account>;
  /** Exchange rate between the currency of the transaction and the currency of the host (transaction.amount * transaction.hostCurrencyFxRate = transaction.amountInHostCurrency) */
  hostCurrencyFxRate?: Maybe<Scalars['Float']>;
  hostFee?: Maybe<Amount>;
  id: Scalars['String'];
  invoiceTemplate?: Maybe<Scalars['String']>;
  isDisputed?: Maybe<Scalars['Boolean']>;
  isInReview?: Maybe<Scalars['Boolean']>;
  isOrderRejected: Scalars['Boolean'];
  isRefund?: Maybe<Scalars['Boolean']>;
  isRefunded?: Maybe<Scalars['Boolean']>;
  kind?: Maybe<TransactionKind>;
  legacyId: Scalars['Int'];
  /** Merchant id related to the Transaction (Stripe, PayPal, Wise, Privacy) */
  merchantId?: Maybe<Scalars['String']>;
  netAmount: Amount;
  netAmountInHostCurrency: Amount;
  oppositeAccount?: Maybe<Account>;
  order?: Maybe<Order>;
  paymentMethod?: Maybe<PaymentMethod>;
  paymentProcessorFee?: Maybe<Amount>;
  payoutMethod?: Maybe<PayoutMethod>;
  permissions?: Maybe<TransactionPermissions>;
  platformFee: Amount;
  refundTransaction?: Maybe<Transaction>;
  relatedTransactions: Array<Maybe<Transaction>>;
  taxAmount: Amount;
  /** If taxAmount is set, this field will contain more info about the tax */
  taxInfo?: Maybe<TaxInfo>;
  /** The recipient of a transaction (on CREDIT = account, DEBIT = oppositeAccount) */
  toAccount?: Maybe<Account>;
  type: TransactionType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** @deprecated 2021-08-15: Use id instead. */
  uuid: Scalars['String'];
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionDescriptionArgs = {
  dynamic?: InputMaybe<Scalars['Boolean']>;
  full?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionHostFeeArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionNetAmountArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionNetAmountInHostCurrencyArgs = {
  fetchHostFee?: InputMaybe<Scalars['Boolean']>;
};


/** Transaction interface shared by all kind of transactions (Debit, Credit) */
export type TransactionRelatedTransactionsArgs = {
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
};

/** A collection of Transactions (Debit or Credit) */
export type TransactionCollection = Collection & {
  __typename?: 'TransactionCollection';
  kinds?: Maybe<Array<Maybe<TransactionKind>>>;
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Transaction>>>;
  offset?: Maybe<Scalars['Int']>;
  /** The types of payment methods used in this collection, regardless of the pagination */
  paymentMethodTypes: Array<Maybe<PaymentMethodType>>;
  totalCount?: Maybe<Scalars['Int']>;
};

export enum TransactionKind {
  ADDED_FUNDS = 'ADDED_FUNDS',
  BALANCE_TRANSFER = 'BALANCE_TRANSFER',
  CONTRIBUTION = 'CONTRIBUTION',
  EXPENSE = 'EXPENSE',
  HOST_FEE = 'HOST_FEE',
  HOST_FEE_SHARE = 'HOST_FEE_SHARE',
  HOST_FEE_SHARE_DEBT = 'HOST_FEE_SHARE_DEBT',
  PAYMENT_PROCESSOR_COVER = 'PAYMENT_PROCESSOR_COVER',
  PAYMENT_PROCESSOR_DISPUTE_FEE = 'PAYMENT_PROCESSOR_DISPUTE_FEE',
  PAYMENT_PROCESSOR_FEE = 'PAYMENT_PROCESSOR_FEE',
  PLATFORM_FEE = 'PLATFORM_FEE',
  PLATFORM_TIP = 'PLATFORM_TIP',
  PLATFORM_TIP_DEBT = 'PLATFORM_TIP_DEBT',
  PREPAID_PAYMENT_METHOD = 'PREPAID_PAYMENT_METHOD'
}

/** Fields for the user permissions on an transaction */
export type TransactionPermissions = {
  __typename?: 'TransactionPermissions';
  /** Whether the current user can download this transaction's invoice */
  canDownloadInvoice: Scalars['Boolean'];
  /** Whether the current user can edit the transaction */
  canRefund: Scalars['Boolean'];
  /** Whether the current user can reject the transaction */
  canReject: Scalars['Boolean'];
  id: Scalars['String'];
};

export type TransactionReferenceInput = {
  /** The public id identifying the transaction (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The internal id of the transaction (ie: 580) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

export enum TransactionSettlementStatus {
  INVOICED = 'INVOICED',
  OWED = 'OWED',
  SETTLED = 'SETTLED'
}

/** All transaction types */
export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT'
}

/** TransferWise related properties for bank transfer. */
export type TransferWise = {
  __typename?: 'TransferWise';
  availableCurrencies?: Maybe<Array<Maybe<Scalars['JSONObject']>>>;
  /** Unique identifier for this Wise object */
  id: Scalars['String'];
  requiredFields?: Maybe<Array<Maybe<TransferWiseRequiredField>>>;
};


/** TransferWise related properties for bank transfer. */
export type TransferWiseAvailableCurrenciesArgs = {
  ignoreBlockedCurrencies?: InputMaybe<Scalars['Boolean']>;
};


/** TransferWise related properties for bank transfer. */
export type TransferWiseRequiredFieldsArgs = {
  accountDetails?: InputMaybe<Scalars['JSON']>;
  currency: Scalars['String'];
};

export type TransferWiseField = {
  __typename?: 'TransferWiseField';
  group?: Maybe<Array<Maybe<TransferWiseFieldGroup>>>;
  name?: Maybe<Scalars['String']>;
};

export type TransferWiseFieldGroup = {
  __typename?: 'TransferWiseFieldGroup';
  displayFormat?: Maybe<Scalars['String']>;
  example?: Maybe<Scalars['String']>;
  key?: Maybe<Scalars['String']>;
  maxLength?: Maybe<Scalars['Int']>;
  minLength?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  refreshRequirementsOnChange?: Maybe<Scalars['Boolean']>;
  required?: Maybe<Scalars['Boolean']>;
  type?: Maybe<Scalars['String']>;
  validationAsync?: Maybe<Scalars['String']>;
  validationRegexp?: Maybe<Scalars['String']>;
  valuesAllowed?: Maybe<Array<Maybe<TransferWiseFieldVatvkluesAllowed>>>;
};

export type TransferWiseFieldVatvkluesAllowed = {
  __typename?: 'TransferWiseFieldVatvkluesAllowed';
  key?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type TransferWiseRequiredField = {
  __typename?: 'TransferWiseRequiredField';
  fields?: Maybe<Array<Maybe<TransferWiseField>>>;
  title?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

/** This represents an Update */
export type Update = {
  __typename?: 'Update';
  account?: Maybe<Account>;
  /** Some stats about the target audience. Will be null if the update is already published or if you don't have enough permissions so see this information. Not backed by a loader, avoid using this field in lists. */
  audienceStats?: Maybe<UpdateAudienceStats>;
  /** List the comments for this update. Not backed by a loader, don't use this in lists. */
  comments?: Maybe<CommentCollection>;
  createdAt: Scalars['DateTime'];
  fromAccount?: Maybe<Account>;
  html?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  isChangelog: Scalars['Boolean'];
  isPrivate: Scalars['Boolean'];
  legacyId?: Maybe<Scalars['Int']>;
  makePublicOn?: Maybe<Scalars['DateTime']>;
  notificationAudience?: Maybe<UpdateAudience>;
  publishedAt?: Maybe<Scalars['DateTime']>;
  /** Returns a map of reactions counts for this update */
  reactions?: Maybe<Scalars['JSON']>;
  slug: Scalars['String'];
  summary?: Maybe<Scalars['String']>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  /** Indicates whether or not the user is allowed to publish this update */
  userCanPublishUpdate: Scalars['Boolean'];
  /** Indicates whether or not the user is allowed to see the content of this update */
  userCanSeeUpdate: Scalars['Boolean'];
  /** Returns the list of reactions added to this update by logged in user */
  userReactions?: Maybe<Array<Maybe<Scalars['String']>>>;
};


/** This represents an Update */
export type UpdateAudienceStatsArgs = {
  audience?: InputMaybe<UpdateAudience>;
};


/** This represents an Update */
export type UpdateCommentsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** Defines targets for an update */
export enum UpdateAudience {
  /** Will be sent to collective admins and financial contributors */
  ALL = 'ALL',
  /** Will be sent to collective admins */
  COLLECTIVE_ADMINS = 'COLLECTIVE_ADMINS',
  /** Will be sent to financial contributors */
  FINANCIAL_CONTRIBUTORS = 'FINANCIAL_CONTRIBUTORS',
  /** Will be sent to no one */
  NO_ONE = 'NO_ONE'
}

/** Stats about the potential audience of an update */
export type UpdateAudienceStats = {
  __typename?: 'UpdateAudienceStats';
  collectives: Scalars['Int'];
  coreContributors: Scalars['Int'];
  hosted: Scalars['Int'];
  id: Scalars['String'];
  individuals: Scalars['Int'];
  organizations: Scalars['Int'];
  /** The total number of emails to send */
  total: Scalars['Int'];
};

/** Input to order updates chronologically */
export type UpdateChronologicalOrderInput = {
  /** Ordering direction. */
  direction?: OrderDirection;
  /** Field to chronologically order by. */
  field?: UpdateDateTimeField;
};

/** A collection of "Updates" */
export type UpdateCollection = Collection & {
  __typename?: 'UpdateCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Update>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input type for UpdateType */
export type UpdateCreateInput = {
  account: AccountReferenceInput;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  html: Scalars['String'];
  isChangelog?: InputMaybe<Scalars['Boolean']>;
  isPrivate?: InputMaybe<Scalars['Boolean']>;
  makePublicOn?: InputMaybe<Scalars['IsoDateString']>;
  title: Scalars['String'];
};

/** All possible DateTime fields for an update */
export enum UpdateDateTimeField {
  /** The creation time */
  CREATED_AT = 'CREATED_AT',
  /** The creation time */
  PUBLISHED_AT = 'PUBLISHED_AT'
}

export type UpdateReferenceInput = {
  /** The public id identifying the update */
  id?: InputMaybe<Scalars['String']>;
};

/** Input type for UpdateType */
export type UpdateUpdateInput = {
  fromAccount?: InputMaybe<AccountReferenceInput>;
  html?: InputMaybe<Scalars['String']>;
  id: Scalars['String'];
  isPrivate?: InputMaybe<Scalars['Boolean']>;
  makePublicOn?: InputMaybe<Scalars['DateTime']>;
  slug?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

/** A collection of "Updates" */
export type UpdatesCollection = Collection & {
  __typename?: 'UpdatesCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Update>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** This represents a Vendor account */
export type Vendor = Account & AccountWithContributions & AccountWithHost & {
  __typename?: 'Vendor';
  /** List of activities that the logged-in user is subscribed for this collective */
  activitySubscriptions?: Maybe<Array<Maybe<ActivitySubscription>>>;
  /** Date of approval by the Fiscal Host. */
  approvedAt?: Maybe<Scalars['DateTime']>;
  backgroundImageUrl?: Maybe<Scalars['String']>;
  categories: Array<Maybe<Scalars['String']>>;
  childrenAccounts: AccountCollection;
  /** The list of connected accounts (Stripe, Twitter, etc ...). Admin only. Scope: "connectedAccounts". */
  connectedAccounts?: Maybe<Array<Maybe<ConnectedAccount>>>;
  contributionPolicy?: Maybe<Scalars['String']>;
  /** All the persons and entities that contribute to this account */
  contributors: ContributorCollection;
  conversations: ConversationCollection;
  /** Returns conversation's tags for collective sorted by popularity */
  conversationsTags?: Maybe<Array<Maybe<TagStat>>>;
  /** The time of creation */
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  /** Returns the emails of the account. Individuals only have one, but organizations can have multiple emails. */
  emails?: Maybe<Array<Scalars['EmailAddress']>>;
  expensePolicy?: Maybe<Scalars['String']>;
  /** Returns expense tags for collective sorted by popularity */
  expensesTags?: Maybe<Array<Maybe<TagStat>>>;
  /** Describes the features enabled and available for this account */
  features: CollectiveFeatures;
  /** @deprecated 2022-06-03: Please use repositoryUrl */
  githubHandle?: Maybe<Scalars['String']>;
  /** Returns the Fiscal Host */
  host?: Maybe<Host>;
  /** Fees percentage that the host takes for this collective */
  hostFeePercent?: Maybe<Scalars['Float']>;
  /** Describe how the host charges the collective */
  hostFeesStructure?: Maybe<HostFeeStructure>;
  id: Scalars['String'];
  imageUrl?: Maybe<Scalars['String']>;
  /** Returns whether it's active: can accept financial contributions and pay expenses. */
  isActive: Scalars['Boolean'];
  /** Returns true if the remote user is an admin of this account */
  isAdmin: Scalars['Boolean'];
  /** Returns whether it's approved by the Fiscal Host */
  isApproved: Scalars['Boolean'];
  /** Returns whether this account is archived */
  isArchived: Scalars['Boolean'];
  /** Whether this account is frozen */
  isFrozen: Scalars['Boolean'];
  /** Returns whether the account is setup to Host collectives. */
  isHost: Scalars['Boolean'];
  /** Defines if the contributors wants to be incognito (name not displayed) */
  isIncognito: Scalars['Boolean'];
  legacyId: Scalars['Int'];
  /** Private, legal name. Used for expense receipts, taxes, etc. Scope: "account". */
  legalName?: Maybe<Scalars['String']>;
  /** The address associated to this account. This field is always public for collectives and events. */
  location?: Maybe<Location>;
  longDescription?: Maybe<Scalars['String']>;
  /** [AUTHENTICATED] Returns the pending invitations */
  memberInvitations?: Maybe<Array<Maybe<MemberInvitation>>>;
  memberOf: MemberOfCollection;
  /** Get all members (admins, members, backers, followers) */
  members: MemberCollection;
  /** Public name */
  name?: Maybe<Scalars['String']>;
  /** The list of applications created by this account. Admin only. Scope: "applications". */
  oAuthApplications?: Maybe<OAuthApplicationCollection>;
  orders: OrderCollection;
  /** @deprecated 2022-12-16: use parent on AccountWithParent instead */
  parentAccount?: Maybe<Account>;
  /** The list of payment methods that this collective can use to pay for Orders. Admin only. Scope: "orders". */
  paymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payment methods for this account that are pending a client confirmation (3D Secure / SCA) */
  paymentMethodsWithPendingConfirmation?: Maybe<Array<Maybe<PaymentMethod>>>;
  /** The list of payout methods that this collective can use to get paid. In most cases, admin only and scope: "expenses". */
  payoutMethods?: Maybe<Array<Maybe<PayoutMethod>>>;
  /** Logged-in user permissions on an account */
  permissions: AccountPermissions;
  /** Returns true if a custom contribution to Open Collective can be submitted for contributions made to this account */
  platformContributionAvailable: Scalars['Boolean'];
  /** How much platform fees are charged for this account */
  platformFeePercent: Scalars['Float'];
  /** Policies for the account. To see non-public policies you need to be admin and have the scope: "account". */
  policies: Policies;
  /** @deprecated 2023-01-16: Please use socialLinks */
  repositoryUrl?: Maybe<Scalars['String']>;
  settings: Scalars['JSON'];
  /** The slug identifying the account (ie: babel) */
  slug: Scalars['String'];
  socialLinks: Array<SocialLink>;
  stats?: Maybe<AccountStats>;
  /** The list of expense types supported by this account */
  supportedExpenseTypes: Array<ExpenseType>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  tiers: TierCollection;
  /** Number of unique financial contributors. */
  totalFinancialContributors: Scalars['Int'];
  transactions: TransactionCollection;
  transferwise?: Maybe<TransferWise>;
  /** @deprecated 2023-01-16: Please use socialLinks */
  twitterHandle?: Maybe<Scalars['String']>;
  type: AccountType;
  updatedAt?: Maybe<Scalars['DateTime']>;
  /** Updates published by the account. To see unpublished updates, you need to be an admin and have the scope "updates". */
  updates: UpdateCollection;
  /** Virtual Cards Merchants used by the account. Admin only. Scope: "virtualCards". */
  virtualCardMerchants?: Maybe<AccountCollection>;
  /** Virtual Cards attached to the account. Admin only. Scope: "virtualCards". */
  virtualCards?: Maybe<VirtualCardCollection>;
  webhooks: WebhookCollection;
  /** @deprecated 2023-01-16: Please use socialLinks */
  website?: Maybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorActivitySubscriptionsArgs = {
  channel?: InputMaybe<ActivityChannel>;
};


/** This represents a Vendor account */
export type VendorBackgroundImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Vendor account */
export type VendorChildrenAccountsArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorContributorsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  roles?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorConversationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  tag?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorConversationsTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorExpensesTagsArgs = {
  limit?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorHostFeePercentArgs = {
  paymentMethodService?: InputMaybe<PaymentMethodService>;
  paymentMethodType?: InputMaybe<PaymentMethodType>;
};


/** This represents a Vendor account */
export type VendorImageUrlArgs = {
  format?: InputMaybe<ImageFormat>;
  height?: InputMaybe<Scalars['Int']>;
};


/** This represents a Vendor account */
export type VendorMemberInvitationsArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  memberAccount?: InputMaybe<AccountReferenceInput>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorMemberOfArgs = {
  account?: InputMaybe<AccountReferenceInput>;
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  hostFeesStructure?: InputMaybe<HostFeeStructure>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  isApproved?: InputMaybe<Scalars['Boolean']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  isHostAccount?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: OrderByInput;
  orderByRoles?: InputMaybe<Scalars['Boolean']>;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorMembersArgs = {
  accountType?: InputMaybe<Array<InputMaybe<AccountType>>>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  includeInherited?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  role?: InputMaybe<Array<InputMaybe<MemberRole>>>;
};


/** This represents a Vendor account */
export type VendorOAuthApplicationsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorOrdersArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  filter?: InputMaybe<AccountOrdersFilter>;
  frequency?: InputMaybe<ContributionFrequency>;
  includeHostedAccounts?: InputMaybe<Scalars['Boolean']>;
  includeIncognito?: InputMaybe<Scalars['Boolean']>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  onlyActiveSubscriptions?: InputMaybe<Scalars['Boolean']>;
  onlySubscriptions?: InputMaybe<Scalars['Boolean']>;
  orderBy?: ChronologicalOrderInput;
  paymentMethod?: InputMaybe<PaymentMethodReferenceInput>;
  searchTerm?: InputMaybe<Scalars['String']>;
  status?: InputMaybe<Array<InputMaybe<OrderStatus>>>;
  tierSlug?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorPaymentMethodsArgs = {
  enumType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  includeExpired?: InputMaybe<Scalars['Boolean']>;
  service?: InputMaybe<Array<InputMaybe<PaymentMethodService>>>;
  type?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
};


/** This represents a Vendor account */
export type VendorTiersArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorTotalFinancialContributorsArgs = {
  accountType?: InputMaybe<AccountType>;
};


/** This represents a Vendor account */
export type VendorTransactionsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  fromAccount?: InputMaybe<AccountReferenceInput>;
  group?: InputMaybe<Scalars['String']>;
  hasExpense?: InputMaybe<Scalars['Boolean']>;
  hasOrder?: InputMaybe<Scalars['Boolean']>;
  host?: InputMaybe<AccountReferenceInput>;
  includeChildrenTransactions?: Scalars['Boolean'];
  includeDebts?: Scalars['Boolean'];
  includeGiftCardTransactions?: Scalars['Boolean'];
  includeIncognitoTransactions?: Scalars['Boolean'];
  includeRegularTransactions?: Scalars['Boolean'];
  kind?: InputMaybe<Array<InputMaybe<TransactionKind>>>;
  limit?: Scalars['Int'];
  maxAmount?: InputMaybe<Scalars['Int']>;
  minAmount?: InputMaybe<Scalars['Int']>;
  offset?: Scalars['Int'];
  orderBy?: ChronologicalOrderInput;
  paymentMethodType?: InputMaybe<Array<InputMaybe<PaymentMethodType>>>;
  searchTerm?: InputMaybe<Scalars['String']>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  type?: InputMaybe<TransactionType>;
};


/** This represents a Vendor account */
export type VendorUpdatesArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
  onlyChangelogUpdates?: InputMaybe<Scalars['Boolean']>;
  onlyPublishedUpdates?: InputMaybe<Scalars['Boolean']>;
  orderBy?: UpdateChronologicalOrderInput;
  searchTerm?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorVirtualCardMerchantsArgs = {
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};


/** This represents a Vendor account */
export type VendorVirtualCardsArgs = {
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  limit?: Scalars['Int'];
  merchantAccount?: InputMaybe<AccountReferenceInput>;
  offset?: Scalars['Int'];
  orderBy?: InputMaybe<ChronologicalOrderInput>;
  state?: InputMaybe<Scalars['String']>;
};


/** This represents a Vendor account */
export type VendorWebhooksArgs = {
  account: AccountReferenceInput;
  limit?: Scalars['Int'];
  offset?: Scalars['Int'];
};

/** A Virtual Card used to pay expenses */
export type VirtualCard = {
  __typename?: 'VirtualCard';
  account?: Maybe<Account>;
  assignee?: Maybe<Individual>;
  createdAt?: Maybe<Scalars['DateTime']>;
  currency?: Maybe<Currency>;
  data?: Maybe<Scalars['JSONObject']>;
  host?: Maybe<Account>;
  id?: Maybe<Scalars['String']>;
  last4?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  privateData?: Maybe<Scalars['JSONObject']>;
  provider?: Maybe<Scalars['String']>;
  remainingLimit?: Maybe<Scalars['Int']>;
  spendingLimitAmount?: Maybe<Scalars['Int']>;
  spendingLimitInterval?: Maybe<VirtualCardLimitInterval>;
  spendingLimitRenewsOn?: Maybe<Scalars['DateTime']>;
  updatedAt?: Maybe<Scalars['DateTime']>;
};

/** A collection of Virtual Cards */
export type VirtualCardCollection = Collection & {
  __typename?: 'VirtualCardCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<VirtualCard>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

export type VirtualCardInput = {
  data?: InputMaybe<Scalars['JSONObject']>;
  id?: InputMaybe<Scalars['String']>;
  last4?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  privateData?: InputMaybe<Scalars['JSONObject']>;
  provider?: InputMaybe<VirtualCardProvider>;
};

export enum VirtualCardLimitInterval {
  ALL_TIME = 'ALL_TIME',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  PER_AUTHORIZATION = 'PER_AUTHORIZATION',
  WEEKLY = 'WEEKLY',
  YEARLY = 'YEARLY'
}

export enum VirtualCardProvider {
  PRIVACY = 'PRIVACY',
  STRIPE = 'STRIPE'
}

export type VirtualCardReferenceInput = {
  id?: InputMaybe<Scalars['String']>;
};

/** An webhook attached to an account */
export type Webhook = {
  __typename?: 'Webhook';
  account: Account;
  activityType?: Maybe<ActivityType>;
  id: Scalars['String'];
  legacyId: Scalars['Int'];
  webhookUrl?: Maybe<Scalars['URL']>;
};

/** A collection of webhooks */
export type WebhookCollection = Collection & {
  __typename?: 'WebhookCollection';
  limit?: Maybe<Scalars['Int']>;
  nodes?: Maybe<Array<Maybe<Webhook>>>;
  offset?: Maybe<Scalars['Int']>;
  totalCount?: Maybe<Scalars['Int']>;
};

/** Input type for Webhooks */
export type WebhookCreateInput = {
  /** The account to attach the Webhook */
  account: AccountReferenceInput;
  activityType?: ActivityType;
  webhookUrl: Scalars['URL'];
};

export type WebhookReferenceInput = {
  /** The public id identifying the webhook (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the webhook (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
};

/** Input type to update a Webhook */
export type WebhookUpdateInput = {
  activityType?: ActivityType;
  /** The public id identifying the webhook (ie: dgm9bnk8-0437xqry-ejpvzeol-jdayw5re) */
  id?: InputMaybe<Scalars['String']>;
  /** The legacy public id identifying the webhook (ie: 4242) */
  legacyId?: InputMaybe<Scalars['Int']>;
  webhookUrl: Scalars['URL'];
};

export type SearchTagsQueryVariables = Exact<{
  term?: InputMaybe<Scalars['String']>;
}>;


export type SearchTagsQuery = { __typename?: 'Query', tagStats: { __typename?: 'TagStatsCollection', nodes?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null } };

export type TagStatsQueryVariables = Exact<{
  host?: InputMaybe<AccountReferenceInput>;
}>;


export type TagStatsQuery = { __typename?: 'Query', tagStats: { __typename?: 'TagStatsCollection', nodes?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null } };

export type AdminPanelQueryVariables = Exact<{
  slug: Scalars['String'];
}>;


export type AdminPanelQuery = { __typename?: 'Query', account?: { __typename?: 'Bot', id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Collective', hostFeePercent?: number | null, isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, settings: any, policies: { __typename?: 'Policies', EXPENSE_AUTHOR_CANNOT_APPROVE?: { __typename?: 'EXPENSE_AUTHOR_CANNOT_APPROVE', enabled?: boolean | null, amountInCents?: number | null, appliesToHostedCollectives?: boolean | null, appliesToSingleAdminCollectives?: boolean | null } | null, COLLECTIVE_MINIMUM_ADMINS?: { __typename?: 'COLLECTIVE_MINIMUM_ADMINS', numberOfAdmins?: number | null, applies?: PolicyApplication | null, freeze?: boolean | null } | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Event', hostFeePercent?: number | null, isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, parent?: { __typename?: 'Bot', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Collective', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Event', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Fund', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Host', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Individual', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Organization', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Project', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Vendor', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | null, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, settings: any, policies: { __typename?: 'Policies', EXPENSE_AUTHOR_CANNOT_APPROVE?: { __typename?: 'EXPENSE_AUTHOR_CANNOT_APPROVE', enabled?: boolean | null, amountInCents?: number | null, appliesToHostedCollectives?: boolean | null, appliesToSingleAdminCollectives?: boolean | null } | null, COLLECTIVE_MINIMUM_ADMINS?: { __typename?: 'COLLECTIVE_MINIMUM_ADMINS', numberOfAdmins?: number | null, applies?: PolicyApplication | null, freeze?: boolean | null } | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Fund', hostFeePercent?: number | null, isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, settings: any, policies: { __typename?: 'Policies', EXPENSE_AUTHOR_CANNOT_APPROVE?: { __typename?: 'EXPENSE_AUTHOR_CANNOT_APPROVE', enabled?: boolean | null, amountInCents?: number | null, appliesToHostedCollectives?: boolean | null, appliesToSingleAdminCollectives?: boolean | null } | null, COLLECTIVE_MINIMUM_ADMINS?: { __typename?: 'COLLECTIVE_MINIMUM_ADMINS', numberOfAdmins?: number | null, applies?: PolicyApplication | null, freeze?: boolean | null } | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Host', id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Individual', id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Organization', id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Project', hostFeePercent?: number | null, isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, parent?: { __typename?: 'Bot', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Collective', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Event', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Fund', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Host', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Individual', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Organization', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Project', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Vendor', id: string, slug: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | null, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, settings: any, policies: { __typename?: 'Policies', EXPENSE_AUTHOR_CANNOT_APPROVE?: { __typename?: 'EXPENSE_AUTHOR_CANNOT_APPROVE', enabled?: boolean | null, amountInCents?: number | null, appliesToHostedCollectives?: boolean | null, appliesToSingleAdminCollectives?: boolean | null } | null, COLLECTIVE_MINIMUM_ADMINS?: { __typename?: 'COLLECTIVE_MINIMUM_ADMINS', numberOfAdmins?: number | null, applies?: PolicyApplication | null, freeze?: boolean | null } | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Vendor', hostFeePercent?: number | null, isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, isHost: boolean, type: AccountType, settings: any, isArchived: boolean, isIncognito: boolean, imageUrl?: string | null, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, settings: any, policies: { __typename?: 'Policies', EXPENSE_AUTHOR_CANNOT_APPROVE?: { __typename?: 'EXPENSE_AUTHOR_CANNOT_APPROVE', enabled?: boolean | null, amountInCents?: number | null, appliesToHostedCollectives?: boolean | null, appliesToSingleAdminCollectives?: boolean | null } | null, COLLECTIVE_MINIMUM_ADMINS?: { __typename?: 'COLLECTIVE_MINIMUM_ADMINS', numberOfAdmins?: number | null, applies?: PolicyApplication | null, freeze?: boolean | null } | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, VIRTUAL_CARDS?: CollectiveFeatureStatus | null, USE_PAYMENT_METHODS?: CollectiveFeatureStatus | null, EMIT_GIFT_CARDS?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | null };

export type NavbarFieldsFragment = { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null };

export type ContributionFlowPaymentMethodsQueryVariables = Exact<{
  slug?: InputMaybe<Scalars['String']>;
}>;


export type ContributionFlowPaymentMethodsQuery = { __typename?: 'Query', account?: { __typename?: 'Bot', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Collective', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Event', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Fund', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Host', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Individual', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Organization', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Project', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | { __typename?: 'Vendor', id: string, paymentMethods?: Array<{ __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, sourcePaymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, name?: string | null, data?: any | null, service?: PaymentMethodService | null, type?: PaymentMethodType | null, expiryDate?: any | null, providerType?: PaymentMethodLegacyType | null, balance: { __typename?: 'Amount', currency?: Currency | null }, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null, balance: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, account?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, imageUrl?: string | null } | null, limitedToHosts?: Array<{ __typename?: 'Host', id: string, legacyId: number, slug: string } | null> | null } | null> | null } | null };

export type EditVirtualCardMutationVariables = Exact<{
  virtualCard: VirtualCardReferenceInput;
  name: Scalars['String'];
  limitAmount?: InputMaybe<AmountInput>;
  limitInterval?: InputMaybe<VirtualCardLimitInterval>;
  assignee: AccountReferenceInput;
}>;


export type EditVirtualCardMutation = { __typename?: 'Mutation', editVirtualCard: { __typename?: 'VirtualCard', id?: string | null, name?: string | null, spendingLimitAmount?: number | null, spendingLimitInterval?: VirtualCardLimitInterval | null, assignee?: { __typename?: 'Individual', id: string, name?: string | null, slug: string, imageUrl?: string | null } | null } };

export type CreateVirtualCardMutationVariables = Exact<{
  name: Scalars['String'];
  limitAmount: AmountInput;
  limitInterval: VirtualCardLimitInterval;
  account: AccountReferenceInput;
  assignee: AccountReferenceInput;
}>;


export type CreateVirtualCardMutation = { __typename?: 'Mutation', createVirtualCard: { __typename?: 'VirtualCard', id?: string | null, name?: string | null, last4?: string | null, data?: any | null } };

export type CollectiveMembersQueryVariables = Exact<{
  slug: Scalars['String'];
}>;


export type CollectiveMembersQuery = { __typename?: 'Query', account?: { __typename?: 'Bot', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Collective', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Event', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Fund', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Host', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Individual', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Organization', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Project', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | { __typename?: 'Vendor', id: string, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, account?: { __typename?: 'Bot', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Collective', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Event', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Fund', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Host', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Individual', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Organization', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Project', id: string, name?: string | null, imageUrl?: string | null, slug: string } | { __typename?: 'Vendor', id: string, name?: string | null, imageUrl?: string | null, slug: string } | null } | null> | null } } | null };

export type VirtualCardPoliciesQueryQueryVariables = Exact<{
  slug?: InputMaybe<Scalars['String']>;
}>;


export type VirtualCardPoliciesQueryQuery = { __typename?: 'Query', account?: { __typename?: 'Bot', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Collective', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Event', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Fund', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Host', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Individual', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Organization', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Project', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | { __typename?: 'Vendor', id: string, policies: { __typename?: 'Policies', MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL?: { __typename?: 'MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL', ALL_TIME?: { __typename?: 'Amount', valueInCents?: number | null } | null, DAILY?: { __typename?: 'Amount', valueInCents?: number | null } | null, MONTHLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, PER_AUTHORIZATION?: { __typename?: 'Amount', valueInCents?: number | null } | null, WEEKLY?: { __typename?: 'Amount', valueInCents?: number | null } | null, YEARLY?: { __typename?: 'Amount', valueInCents?: number | null } | null } | null } } | null };

export type MemberFieldsFragment = { __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null };

export type TeamSectionQueryVariables = Exact<{
  collectiveSlug: Scalars['String'];
  account: AccountReferenceInput;
}>;


export type TeamSectionQuery = { __typename?: 'Query', account?: { __typename?: 'Bot', id: string, isFrozen: boolean, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Collective', id: string, isFrozen: boolean, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, CONTACT_FORM?: CollectiveFeatureStatus | null } } | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Event', id: string, isFrozen: boolean, parent?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null } | null, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, CONTACT_FORM?: CollectiveFeatureStatus | null } } | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Fund', id: string, isFrozen: boolean, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, CONTACT_FORM?: CollectiveFeatureStatus | null } } | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Host', id: string, isFrozen: boolean, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Individual', id: string, isFrozen: boolean, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Organization', id: string, isFrozen: boolean, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Project', id: string, isFrozen: boolean, parent?: { __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null } | null, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, CONTACT_FORM?: CollectiveFeatureStatus | null } } | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | { __typename?: 'Vendor', id: string, isFrozen: boolean, host?: { __typename?: 'Host', id: string, slug: string, name?: string | null, features: { __typename?: 'CollectiveFeatures', id: string, CONTACT_FORM?: CollectiveFeatureStatus | null } } | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Event', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Host', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Project', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, type: AccountType, name?: string | null, members: { __typename?: 'MemberCollection', nodes?: Array<{ __typename?: 'Member', id?: string | null, role?: MemberRole | null, since?: any | null, createdAt?: any | null, description?: string | null, inherited?: boolean | null, account?: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | null } | null> | null } } | null> | null } } | null, memberInvitations?: Array<{ __typename?: 'MemberInvitation', id: string, role: MemberRole, since?: any | null, createdAt: any, description?: string | null, account: { __typename?: 'Bot', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', email?: string | null, id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, type: AccountType, imageUrl?: string | null } } | null> | null };

export type LoggedInAccountExpensePayoutFieldsFragment = { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, hasTwoFactorAuth?: boolean | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, adminMemberships: { __typename?: 'MemberOfCollection', nodes?: Array<{ __typename?: 'MemberOf', id?: string | null, account?: { __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive?: boolean | null, isHost: boolean, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive: boolean, isHost: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive: boolean, isHost: boolean, parent?: { __typename?: 'Bot', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Collective', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Event', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Fund', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Host', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Individual', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Organization', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Project', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Vendor', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | null, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive: boolean, isHost: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive?: boolean | null, isHost: boolean, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive?: boolean | null, isHost: boolean, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive?: boolean | null, isHost: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive: boolean, isHost: boolean, parent?: { __typename?: 'Bot', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Collective', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Event', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Fund', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Host', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Individual', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Organization', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Project', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | { __typename?: 'Vendor', id: string, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | null, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, legalName?: string | null, isActive: boolean, isHost: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive?: boolean | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, type: AccountType, name?: string | null, isActive: boolean } | null> | null } } | null } | null> | null } };

export type ExpenseHostFieldsFragment = { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } };

export type ExpensePageExpenseFieldsFragment = { __typename?: 'Expense', id: string, legacyId: number, description: string, longDescription?: string | null, currency: Currency, type: ExpenseType, status: ExpenseStatus, privateMessage?: string | null, tags: Array<string | null>, amount: number, createdAt: any, invoiceInfo?: string | null, requiredLegalDocuments?: Array<LegalDocumentType | null> | null, feesPayer: FeesPayer, draft?: any | null, amountInAccountCurrency?: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null, exchangeRate?: { __typename?: 'CurrencyExchangeRate', date: any, value: number, source: CurrencyExchangeRateSourceType, isApproximate: boolean } | null } | null, items?: Array<{ __typename?: 'ExpenseItem', id: string, incurredAt: any, description?: string | null, amount: number, url?: any | null } | null> | null, taxes: Array<{ __typename?: 'TaxInfo', id: string, type: OrderTaxType, rate: number, idNumber?: string | null } | null>, attachedFiles?: Array<{ __typename?: 'ExpenseAttachedFile', id: string, url?: any | null, name?: string | null, info?: { __typename?: 'GenericFileInfo', id: string, name?: string | null, size?: number | null } | { __typename?: 'ImageFileInfo', id: string, name?: string | null, size?: number | null } | null }> | null, payee: { __typename?: 'Bot', id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Collective', isApproved: boolean, id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Event', isApproved: boolean, id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Fund', isApproved: boolean, id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Project', isApproved: boolean, id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | { __typename?: 'Vendor', isApproved: boolean, id: string, slug: string, name?: string | null, legalName?: string | null, type: AccountType, isAdmin: boolean, host?: { __typename?: 'Host', id: string, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, payoutMethods?: Array<{ __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, name?: string | null, data?: any | null, isSaved?: boolean | null } | null> | null }, payeeLocation?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null, structured?: any | null } | null, createdByAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | null, host?: { __typename?: 'Bot', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Collective', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Event', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Fund', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Individual', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Organization', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Project', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | { __typename?: 'Vendor', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, website?: string | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null } | null, requestedByAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null } | null, account: { __typename?: 'Bot', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive?: boolean | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Collective', isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, host?: { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Event', isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, parent?: { __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | null, host?: { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Fund', isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, host?: { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Host', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive?: boolean | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Individual', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive?: boolean | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Organization', isHost: boolean, isActive?: boolean | null, id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, host?: { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Project', isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, parent?: { __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, type: AccountType } | null, host?: { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Vendor', isApproved: boolean, id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, host?: { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, expensesTags?: Array<{ __typename?: 'TagStat', id: string, tag: string } | null> | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null }, payoutMethod?: { __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, data?: any | null, isSaved?: boolean | null } | null, virtualCard?: { __typename?: 'VirtualCard', id?: string | null, name?: string | null, last4?: string | null } | null, permissions: { __typename?: 'ExpensePermissions', id: string, canEdit: boolean, canEditTags: boolean, canDelete: boolean, canSeeInvoiceInfo: boolean, canApprove: boolean, canUnapprove: boolean, canReject: boolean, canMarkAsSpam: boolean, canPay: boolean, canMarkAsUnpaid: boolean, canMarkAsIncomplete: boolean, canComment: boolean, canUnschedulePayment: boolean, approve: { __typename?: 'Permission', allowed: boolean, reason?: string | null, reasonDetails?: any | null } }, activities: Array<{ __typename?: 'Activity', id: string, type: ActivityType, createdAt: any, data: any, individual?: { __typename?: 'Individual', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null } | null }>, recurringExpense?: { __typename?: 'RecurringExpense', id: string, interval: RecurringExpenseInterval, endsAt?: any | null } | null, securityChecks?: Array<{ __typename?: 'SecurityCheck', level: SecurityCheckLevel, message: string, scope: SecurityCheckScope, details?: string | null } | null> | null };

export type ExpensesListFieldsFragmentFragment = { __typename?: 'Expense', id: string, legacyId: number, description: string, status: ExpenseStatus, createdAt: any, tags: Array<string | null>, amount: number, currency: Currency, type: ExpenseType, requiredLegalDocuments?: Array<LegalDocumentType | null> | null, feesPayer: FeesPayer, amountInAccountCurrency?: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null, exchangeRate?: { __typename?: 'CurrencyExchangeRate', date: any, value: number, source: CurrencyExchangeRateSourceType, isApproximate: boolean } | null } | null, account: { __typename?: 'Bot', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, parent?: { __typename?: 'Bot', id: string, slug: string } | { __typename?: 'Collective', id: string, slug: string } | { __typename?: 'Event', id: string, slug: string } | { __typename?: 'Fund', id: string, slug: string } | { __typename?: 'Host', id: string, slug: string } | { __typename?: 'Individual', id: string, slug: string } | { __typename?: 'Organization', id: string, slug: string } | { __typename?: 'Project', id: string, slug: string } | { __typename?: 'Vendor', id: string, slug: string } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Individual', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, parent?: { __typename?: 'Bot', id: string, slug: string } | { __typename?: 'Collective', id: string, slug: string } | { __typename?: 'Event', id: string, slug: string } | { __typename?: 'Fund', id: string, slug: string } | { __typename?: 'Host', id: string, slug: string } | { __typename?: 'Individual', id: string, slug: string } | { __typename?: 'Organization', id: string, slug: string } | { __typename?: 'Project', id: string, slug: string } | { __typename?: 'Vendor', id: string, slug: string } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null }, permissions: { __typename?: 'ExpensePermissions', id: string, canDelete: boolean, canApprove: boolean, canUnapprove: boolean, canReject: boolean, canMarkAsSpam: boolean, canPay: boolean, canMarkAsUnpaid: boolean, canMarkAsIncomplete: boolean, canSeeInvoiceInfo: boolean, canEditTags: boolean, canUnschedulePayment: boolean, approve: { __typename?: 'Permission', allowed: boolean, reason?: string | null, reasonDetails?: any | null } }, payoutMethod?: { __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, data?: any | null, isSaved?: boolean | null } | null, payee: { __typename?: 'Bot', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean } | { __typename?: 'Collective', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Event', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Fund', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Host', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean } | { __typename?: 'Individual', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean } | { __typename?: 'Organization', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Project', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Vendor', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null }, createdByAccount?: { __typename?: 'Bot', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Event', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Fund', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Host', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Individual', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Project', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Vendor', id: string, type: AccountType, slug: string, name?: string | null } | null };

export type ExpensesListAdminFieldsFragmentFragment = { __typename?: 'Expense', id: string, payoutMethod?: { __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, data?: any | null } | null, items?: Array<{ __typename?: 'ExpenseItem', id: string, description?: string | null, incurredAt: any, url?: any | null, amount: number } | null> | null, taxes: Array<{ __typename?: 'TaxInfo', id: string, type: OrderTaxType, rate: number } | null>, attachedFiles?: Array<{ __typename?: 'ExpenseAttachedFile', id: string, url?: any | null, name?: string | null }> | null, securityChecks?: Array<{ __typename?: 'SecurityCheck', level: SecurityCheckLevel, message: string, scope: SecurityCheckScope, details?: string | null } | null> | null };

export type CreatePendingContributionModalQueryVariables = Exact<{
  slug: Scalars['String'];
}>;


export type CreatePendingContributionModalQuery = { __typename?: 'Query', host?: { __typename?: 'Host', id: string, legacyId: number, type: AccountType, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, hostFeePercent?: number | null, isTrustedHost: boolean, plan: { __typename?: 'HostPlan', id?: string | null, hostFees?: boolean | null }, policies: { __typename?: 'Policies', REQUIRE_2FA_FOR_ADMINS?: boolean | null } } | null };

export type CreatePendingContributionCollectiveQueryVariables = Exact<{
  slug: Scalars['String'];
}>;


export type CreatePendingContributionCollectiveQuery = { __typename?: 'Query', account?: { __typename?: 'Bot', id: string, type: AccountType, currency?: string | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Collective', id: string, type: AccountType, currency?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, currency?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, currency?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, currency?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, currency?: string | null, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Organization', id: string, type: AccountType, currency?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, currency?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, currency?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null }, childrenAccounts: { __typename?: 'AccountCollection', nodes?: Array<{ __typename?: 'Bot', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Event', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Fund', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Host', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Individual', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Project', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | { __typename?: 'Vendor', id: string, type: AccountType, legacyId: number, isHost: boolean, name?: string | null, slug: string, currency?: string | null, settings: any, imageUrl?: string | null, tiers: { __typename?: 'TierCollection', nodes?: Array<{ __typename?: 'Tier', id: string, slug?: string | null, legacyId: number, name?: string | null } | null> | null } } | null> | null } } | null };

export type CreatePendingContributionMutationVariables = Exact<{
  order: PendingOrderCreateInput;
}>;


export type CreatePendingContributionMutation = { __typename?: 'Mutation', createPendingOrder: { __typename?: 'Order', legacyId: number, id: string, status?: OrderStatus | null } };

export type EditPendingContributionMutationVariables = Exact<{
  order: PendingOrderEditInput;
}>;


export type EditPendingContributionMutation = { __typename?: 'Mutation', editPendingOrder: { __typename?: 'Order', legacyId: number, id: string, status?: OrderStatus | null } };

export type ClearCacheMutationVariables = Exact<{
  account: AccountReferenceInput;
  cacheTypes?: InputMaybe<Array<AccountCacheType> | AccountCacheType>;
}>;


export type ClearCacheMutation = { __typename?: 'Mutation', clearCacheForAccount: { __typename?: 'Bot', id: string, slug: string, name?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null } };

export type OrderPageQueryVariables = Exact<{
  legacyId: Scalars['Int'];
  collectiveSlug: Scalars['String'];
}>;


export type OrderPageQuery = { __typename?: 'Query', order?: { __typename?: 'Order', id: string, legacyId: number, status?: OrderStatus | null, description?: string | null, tags: Array<string | null>, createdAt?: any | null, processedAt?: any | null, hostFeePercent?: number | null, memo?: string | null, totalAmount: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, amount: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, paymentMethod?: { __typename?: 'PaymentMethod', id?: string | null, type?: PaymentMethodType | null } | null, pendingContributionData?: { __typename?: 'PendingOrderData', expectedAt?: any | null, paymentMethod?: string | null, ponumber?: string | null, memo?: string | null, fromAccountInfo?: { __typename?: 'PendingOrderFromAccountInfo', name?: string | null, email?: string | null } | null } | null, fromAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null, toAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null, bankTransfersHostFeePercent?: number | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null, bankTransfersHostFeePercent?: number | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null, bankTransfersHostFeePercent?: number | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null, bankTransfersHostFeePercent?: number | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null, bankTransfersHostFeePercent?: number | null } | null, createdByAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null, permissions: { __typename?: 'OrderPermissions', id: string, canMarkAsExpired: boolean, canMarkAsPaid: boolean, canEdit: boolean }, transactions: Array<{ __typename?: 'Credit', id: string, legacyId: number, group: string, description?: string | null, type: TransactionType, kind?: TransactionKind | null, createdAt?: any | null, order?: { __typename?: 'Order', id: string } | null, amount: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, netAmount: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, paymentProcessorFee: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, fromAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null, account?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null, toAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null } | { __typename?: 'Debit', id: string, legacyId: number, group: string, description?: string | null, type: TransactionType, kind?: TransactionKind | null, createdAt?: any | null, order?: { __typename?: 'Order', id: string } | null, amount: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, netAmount: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, paymentProcessorFee: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null }, fromAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null, account?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null, toAccount?: { __typename?: 'Bot', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Collective', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Event', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Fund', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Host', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Individual', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Organization', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Project', id: string, slug: string, name?: string | null, imageUrl?: string | null } | { __typename?: 'Vendor', id: string, slug: string, name?: string | null, imageUrl?: string | null } | null } | null> } | null, account?: { __typename?: 'Bot', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive?: boolean | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Collective', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, host?: { __typename?: 'Host', id: string, name?: string | null, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Event', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, parent?: { __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | null, host?: { __typename?: 'Host', id: string, name?: string | null, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Fund', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, host?: { __typename?: 'Host', id: string, name?: string | null, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Host', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive?: boolean | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Individual', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive?: boolean | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Organization', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive?: boolean | null, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Project', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, parent?: { __typename?: 'Bot', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Collective', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Event', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Fund', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Host', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Individual', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Organization', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Project', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | { __typename?: 'Vendor', id: string, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | null, host?: { __typename?: 'Host', id: string, name?: string | null, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Vendor', id: string, legacyId: number, slug: string, name?: string | null, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, isActive: boolean, description?: string | null, settings: any, twitterHandle?: string | null, currency?: string | null, expensePolicy?: string | null, supportedExpenseTypes: Array<ExpenseType>, host?: { __typename?: 'Host', id: string, name?: string | null, slug: string, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null } | null, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null }, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | null };

export type SubmittedExpensesPageQueryVariables = Exact<{
  collectiveSlug: Scalars['String'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  type?: InputMaybe<ExpenseType>;
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>> | InputMaybe<Scalars['String']>>;
  status?: InputMaybe<ExpenseStatusFilter>;
  minAmount?: InputMaybe<Scalars['Int']>;
  maxAmount?: InputMaybe<Scalars['Int']>;
  payoutMethodType?: InputMaybe<PayoutMethodType>;
  dateFrom?: InputMaybe<Scalars['DateTime']>;
  dateTo?: InputMaybe<Scalars['DateTime']>;
  searchTerm?: InputMaybe<Scalars['String']>;
  orderBy?: InputMaybe<ChronologicalOrderInput>;
}>;


export type SubmittedExpensesPageQuery = { __typename?: 'Query', account?: { __typename?: 'Bot', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive?: boolean | null, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Collective', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive: boolean, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Event', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive: boolean, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Fund', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive: boolean, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Host', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive?: boolean | null, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Individual', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive?: boolean | null, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Organization', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive?: boolean | null, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Project', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive: boolean, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | { __typename?: 'Vendor', id: string, legacyId: number, slug: string, type: AccountType, imageUrl?: string | null, backgroundImageUrl?: string | null, twitterHandle?: string | null, name?: string | null, currency?: string | null, isArchived: boolean, isActive: boolean, settings: any, createdAt?: any | null, supportedExpenseTypes: Array<ExpenseType>, isHost: boolean, features: { __typename?: 'CollectiveFeatures', id: string, ABOUT?: CollectiveFeatureStatus | null, CONNECTED_ACCOUNTS?: CollectiveFeatureStatus | null, RECEIVE_FINANCIAL_CONTRIBUTIONS?: CollectiveFeatureStatus | null, RECURRING_CONTRIBUTIONS?: CollectiveFeatureStatus | null, EVENTS?: CollectiveFeatureStatus | null, PROJECTS?: CollectiveFeatureStatus | null, USE_EXPENSES?: CollectiveFeatureStatus | null, RECEIVE_EXPENSES?: CollectiveFeatureStatus | null, COLLECTIVE_GOALS?: CollectiveFeatureStatus | null, TOP_FINANCIAL_CONTRIBUTORS?: CollectiveFeatureStatus | null, CONVERSATIONS?: CollectiveFeatureStatus | null, UPDATES?: CollectiveFeatureStatus | null, TEAM?: CollectiveFeatureStatus | null, CONTACT_FORM?: CollectiveFeatureStatus | null, RECEIVE_HOST_APPLICATIONS?: CollectiveFeatureStatus | null, HOST_DASHBOARD?: CollectiveFeatureStatus | null, TRANSACTIONS?: CollectiveFeatureStatus | null, REQUEST_VIRTUAL_CARDS?: CollectiveFeatureStatus | null } } | null, expenses: { __typename?: 'ExpenseCollection', totalCount?: number | null, offset?: number | null, limit?: number | null, nodes?: Array<{ __typename?: 'Expense', id: string, legacyId: number, description: string, status: ExpenseStatus, createdAt: any, tags: Array<string | null>, amount: number, currency: Currency, type: ExpenseType, requiredLegalDocuments?: Array<LegalDocumentType | null> | null, feesPayer: FeesPayer, amountInCreatedByAccountCurrency?: { __typename?: 'Amount', value?: number | null, valueInCents?: number | null, currency?: Currency | null, exchangeRate?: { __typename?: 'CurrencyExchangeRate', date: any, value: number, source: CurrencyExchangeRateSourceType, isApproximate: boolean } | null } | null, host?: { __typename?: 'Bot', id: string } | { __typename?: 'Collective', id: string } | { __typename?: 'Event', id: string } | { __typename?: 'Fund', id: string } | { __typename?: 'Host', id: string, name?: string | null, legalName?: string | null, slug: string, type: AccountType, currency?: string | null, isHost: boolean, expensePolicy?: string | null, website?: string | null, settings: any, supportedPayoutMethods?: Array<PayoutMethodType | null> | null, isTrustedHost: boolean, hasDisputedOrders: boolean, hasInReviewOrders: boolean, features: { __typename?: 'CollectiveFeatures', id: string, MULTI_CURRENCY_EXPENSES?: CollectiveFeatureStatus | null, PAYPAL_PAYOUTS?: CollectiveFeatureStatus | null }, paypalPreApproval?: { __typename?: 'PaymentMethod', id?: string | null, balance: { __typename?: 'Amount', currency?: Currency | null, valueInCents?: number | null } } | null, location?: { __typename?: 'Location', id?: string | null, address?: string | null, country?: string | null } | null, transferwise?: { __typename?: 'TransferWise', id: string, availableCurrencies?: Array<any | null> | null } | null, plan: { __typename?: 'HostPlan', id?: string | null } } | { __typename?: 'Individual', id: string } | { __typename?: 'Organization', id: string } | { __typename?: 'Project', id: string } | { __typename?: 'Vendor', id: string } | null, amountInAccountCurrency?: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null, exchangeRate?: { __typename?: 'CurrencyExchangeRate', date: any, value: number, source: CurrencyExchangeRateSourceType, isApproximate: boolean } | null } | null, account: { __typename?: 'Bot', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Collective', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Event', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, parent?: { __typename?: 'Bot', id: string, slug: string } | { __typename?: 'Collective', id: string, slug: string } | { __typename?: 'Event', id: string, slug: string } | { __typename?: 'Fund', id: string, slug: string } | { __typename?: 'Host', id: string, slug: string } | { __typename?: 'Individual', id: string, slug: string } | { __typename?: 'Organization', id: string, slug: string } | { __typename?: 'Project', id: string, slug: string } | { __typename?: 'Vendor', id: string, slug: string } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Fund', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Host', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Individual', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Organization', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Project', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, parent?: { __typename?: 'Bot', id: string, slug: string } | { __typename?: 'Collective', id: string, slug: string } | { __typename?: 'Event', id: string, slug: string } | { __typename?: 'Fund', id: string, slug: string } | { __typename?: 'Host', id: string, slug: string } | { __typename?: 'Individual', id: string, slug: string } | { __typename?: 'Organization', id: string, slug: string } | { __typename?: 'Project', id: string, slug: string } | { __typename?: 'Vendor', id: string, slug: string } | null, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null } | { __typename?: 'Vendor', id: string, name?: string | null, slug: string, createdAt?: any | null, currency?: string | null, type: AccountType, stats?: { __typename?: 'AccountStats', id?: string | null, balanceWithBlockedFunds: { __typename?: 'Amount', valueInCents?: number | null, currency?: Currency | null } } | null }, permissions: { __typename?: 'ExpensePermissions', id: string, canDelete: boolean, canApprove: boolean, canUnapprove: boolean, canReject: boolean, canMarkAsSpam: boolean, canPay: boolean, canMarkAsUnpaid: boolean, canMarkAsIncomplete: boolean, canSeeInvoiceInfo: boolean, canEditTags: boolean, canUnschedulePayment: boolean, approve: { __typename?: 'Permission', allowed: boolean, reason?: string | null, reasonDetails?: any | null } }, payoutMethod?: { __typename?: 'PayoutMethod', id: string, type?: PayoutMethodType | null, data?: any | null, isSaved?: boolean | null } | null, payee: { __typename?: 'Bot', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean } | { __typename?: 'Collective', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Event', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Fund', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Host', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean } | { __typename?: 'Individual', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean } | { __typename?: 'Organization', id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Project', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null } | { __typename?: 'Vendor', isApproved: boolean, id: string, type: AccountType, slug: string, name?: string | null, imageUrl?: string | null, isAdmin: boolean, host?: { __typename?: 'Host', id: string } | null }, createdByAccount?: { __typename?: 'Bot', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Collective', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Event', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Fund', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Host', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Individual', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Organization', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Project', id: string, type: AccountType, slug: string, name?: string | null } | { __typename?: 'Vendor', id: string, type: AccountType, slug: string, name?: string | null } | null } | null> | null } };

export const MemberFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MemberFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Member"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"since"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"inherited"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"height"},"value":{"kind":"IntValue","value":"64"}}]},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Individual"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<MemberFieldsFragment, unknown>;
export const LoggedInAccountExpensePayoutFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LoggedInAccountExpensePayoutFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Individual"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"legalName"}},{"kind":"Field","name":{"kind":"Name","value":"hasTwoFactorAuth"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"structured"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"adminMemberships"},"name":{"kind":"Name","value":"memberOf"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"EnumValue","value":"ADMIN"}},{"kind":"Argument","name":{"kind":"Name","value":"includeIncognito"},"value":{"kind":"BooleanValue","value":false}},{"kind":"Argument","name":{"kind":"Name","value":"accountType"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"ORGANIZATION"},{"kind":"EnumValue","value":"COLLECTIVE"},{"kind":"EnumValue","value":"FUND"}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"legalName"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isHost"}},{"kind":"Field","name":{"kind":"Name","value":"policies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"REQUIRE_2FA_FOR_ADMINS"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithParent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"policies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"REQUIRE_2FA_FOR_ADMINS"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"structured"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}},{"kind":"Field","name":{"kind":"Name","value":"childrenAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<LoggedInAccountExpensePayoutFieldsFragment, unknown>;
export const NavbarFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NavbarFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CollectiveFeatures"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ABOUT"}},{"kind":"Field","name":{"kind":"Name","value":"CONNECTED_ACCOUNTS"}},{"kind":"Field","name":{"kind":"Name","value":"RECEIVE_FINANCIAL_CONTRIBUTIONS"}},{"kind":"Field","name":{"kind":"Name","value":"RECURRING_CONTRIBUTIONS"}},{"kind":"Field","name":{"kind":"Name","value":"EVENTS"}},{"kind":"Field","name":{"kind":"Name","value":"PROJECTS"}},{"kind":"Field","name":{"kind":"Name","value":"USE_EXPENSES"}},{"kind":"Field","name":{"kind":"Name","value":"RECEIVE_EXPENSES"}},{"kind":"Field","name":{"kind":"Name","value":"USE_EXPENSES"}},{"kind":"Field","name":{"kind":"Name","value":"COLLECTIVE_GOALS"}},{"kind":"Field","name":{"kind":"Name","value":"TOP_FINANCIAL_CONTRIBUTORS"}},{"kind":"Field","name":{"kind":"Name","value":"CONVERSATIONS"}},{"kind":"Field","name":{"kind":"Name","value":"UPDATES"}},{"kind":"Field","name":{"kind":"Name","value":"TEAM"}},{"kind":"Field","name":{"kind":"Name","value":"CONTACT_FORM"}},{"kind":"Field","name":{"kind":"Name","value":"RECEIVE_HOST_APPLICATIONS"}},{"kind":"Field","name":{"kind":"Name","value":"HOST_DASHBOARD"}},{"kind":"Field","name":{"kind":"Name","value":"TRANSACTIONS"}},{"kind":"Field","name":{"kind":"Name","value":"REQUEST_VIRTUAL_CARDS"}}]}}]} as unknown as DocumentNode<NavbarFieldsFragment, unknown>;
export const ExpenseHostFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpenseHostFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Host"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"legalName"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"isHost"}},{"kind":"Field","name":{"kind":"Name","value":"expensePolicy"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"features"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"MULTI_CURRENCY_EXPENSES"}},{"kind":"Field","name":{"kind":"Name","value":"PAYPAL_PAYOUTS"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paypalPreApproval"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"balance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transferwise"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"availableCurrencies"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supportedPayoutMethods"}},{"kind":"Field","name":{"kind":"Name","value":"isTrustedHost"}},{"kind":"Field","name":{"kind":"Name","value":"hasDisputedOrders"}},{"kind":"Field","name":{"kind":"Name","value":"hasInReviewOrders"}},{"kind":"Field","name":{"kind":"Name","value":"plan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ExpenseHostFieldsFragment, unknown>;
export const ExpensePageExpenseFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpensePageExpenseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Expense"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"longDescription"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"privateMessage"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","alias":{"kind":"Name","value":"amountInAccountCurrency"},"name":{"kind":"Name","value":"amountV2"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"currencySource"},"value":{"kind":"EnumValue","value":"ACCOUNT"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"exchangeRate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"isApproximate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"invoiceInfo"}},{"kind":"Field","name":{"kind":"Name","value":"requiredLegalDocuments"}},{"kind":"Field","name":{"kind":"Name","value":"feesPayer"}},{"kind":"Field","name":{"kind":"Name","value":"draft"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"incurredAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taxes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}},{"kind":"Field","name":{"kind":"Name","value":"idNumber"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attachedFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"payee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"legalName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isApproved"}},{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"payeeLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"structured"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdByAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"legalName"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"website"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"requestedByAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"twitterHandle"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"expensePolicy"}},{"kind":"Field","name":{"kind":"Name","value":"supportedExpenseTypes"}},{"kind":"Field","name":{"kind":"Name","value":"features"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"NavbarFields"}},{"kind":"Field","name":{"kind":"Name","value":"MULTI_CURRENCY_EXPENSES"}}]}},{"kind":"Field","name":{"kind":"Name","value":"expensesTags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tag"}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"balanceWithBlockedFunds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithParent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"twitterHandle"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isApproved"}},{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExpenseHostFields"}},{"kind":"Field","name":{"kind":"Name","value":"transferwise"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"availableCurrencies"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isHost"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExpenseHostFields"}},{"kind":"Field","name":{"kind":"Name","value":"transferwise"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"availableCurrencies"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Event"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Project"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}},{"kind":"Field","name":{"kind":"Name","value":"virtualCard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"last4"}}]}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"canEdit"}},{"kind":"Field","name":{"kind":"Name","value":"canEditTags"}},{"kind":"Field","name":{"kind":"Name","value":"canDelete"}},{"kind":"Field","name":{"kind":"Name","value":"canSeeInvoiceInfo"}},{"kind":"Field","name":{"kind":"Name","value":"canApprove"}},{"kind":"Field","name":{"kind":"Name","value":"canUnapprove"}},{"kind":"Field","name":{"kind":"Name","value":"canReject"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsSpam"}},{"kind":"Field","name":{"kind":"Name","value":"canPay"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsUnpaid"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsIncomplete"}},{"kind":"Field","name":{"kind":"Name","value":"canComment"}},{"kind":"Field","name":{"kind":"Name","value":"canUnschedulePayment"}},{"kind":"Field","name":{"kind":"Name","value":"approve"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allowed"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonDetails"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"activities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"individual"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recurringExpense"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"interval"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"securityChecks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"details"}}]}}]}},...NavbarFieldsFragmentDoc.definitions,...ExpenseHostFieldsFragmentDoc.definitions]} as unknown as DocumentNode<ExpensePageExpenseFieldsFragment, unknown>;
export const ExpensesListFieldsFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpensesListFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Expense"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","alias":{"kind":"Name","value":"amountInAccountCurrency"},"name":{"kind":"Name","value":"amountV2"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"currencySource"},"value":{"kind":"EnumValue","value":"ACCOUNT"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"exchangeRate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"isApproximate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"requiredLegalDocuments"}},{"kind":"Field","name":{"kind":"Name","value":"feesPayer"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"balanceWithBlockedFunds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithParent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"canDelete"}},{"kind":"Field","name":{"kind":"Name","value":"canApprove"}},{"kind":"Field","name":{"kind":"Name","value":"canUnapprove"}},{"kind":"Field","name":{"kind":"Name","value":"canReject"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsSpam"}},{"kind":"Field","name":{"kind":"Name","value":"canPay"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsUnpaid"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsIncomplete"}},{"kind":"Field","name":{"kind":"Name","value":"canSeeInvoiceInfo"}},{"kind":"Field","name":{"kind":"Name","value":"canEditTags"}},{"kind":"Field","name":{"kind":"Name","value":"canUnschedulePayment"}},{"kind":"Field","name":{"kind":"Name","value":"approve"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allowed"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonDetails"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"isSaved"}}]}},{"kind":"Field","name":{"kind":"Name","value":"payee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"height"},"value":{"kind":"IntValue","value":"80"}}]},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isApproved"}},{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdByAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ExpensesListFieldsFragmentFragment, unknown>;
export const ExpensesListAdminFieldsFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ExpensesListAdminFieldsFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Expense"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"payoutMethod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"data"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"incurredAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"taxes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attachedFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"securityChecks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"level"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"scope"}},{"kind":"Field","name":{"kind":"Name","value":"details"}}]}}]}}]} as unknown as DocumentNode<ExpensesListAdminFieldsFragmentFragment, unknown>;
export const SearchTagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchTags"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tagStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tagSearchTerm"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tag"}}]}}]}}]}}]} as unknown as DocumentNode<SearchTagsQuery, SearchTagsQueryVariables>;
export const TagStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"tagStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"host"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountReferenceInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tagStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"host"},"value":{"kind":"Variable","name":{"kind":"Name","value":"host"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tag"}}]}}]}}]}}]} as unknown as DocumentNode<TagStatsQuery, TagStatsQueryVariables>;
export const AdminPanelDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPanel"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isHost"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"isIncognito"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"height"},"value":{"kind":"IntValue","value":"256"}}]},{"kind":"Field","name":{"kind":"Name","value":"features"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"NavbarFields"}},{"kind":"Field","name":{"kind":"Name","value":"VIRTUAL_CARDS"}},{"kind":"Field","name":{"kind":"Name","value":"USE_PAYMENT_METHODS"}},{"kind":"Field","name":{"kind":"Name","value":"EMIT_GIFT_CARDS"}}]}},{"kind":"Field","name":{"kind":"Name","value":"policies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"REQUIRE_2FA_FOR_ADMINS"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithParent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"policies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"REQUIRE_2FA_FOR_ADMINS"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hostFeePercent"}},{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"policies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"EXPENSE_AUTHOR_CANNOT_APPROVE"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"amountInCents"}},{"kind":"Field","name":{"kind":"Name","value":"appliesToHostedCollectives"}},{"kind":"Field","name":{"kind":"Name","value":"appliesToSingleAdminCollectives"}}]}},{"kind":"Field","name":{"kind":"Name","value":"COLLECTIVE_MINIMUM_ADMINS"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"numberOfAdmins"}},{"kind":"Field","name":{"kind":"Name","value":"applies"}},{"kind":"Field","name":{"kind":"Name","value":"freeze"}}]}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isApproved"}}]}}]}}]}},...NavbarFieldsFragmentDoc.definitions]} as unknown as DocumentNode<AdminPanelQuery, AdminPanelQueryVariables>;
export const ContributionFlowPaymentMethodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ContributionFlowPaymentMethods"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethods"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"CREDITCARD"},{"kind":"EnumValue","value":"US_BANK_ACCOUNT"},{"kind":"EnumValue","value":"SEPA_DEBIT"},{"kind":"EnumValue","value":"BACS_DEBIT"},{"kind":"EnumValue","value":"GIFTCARD"},{"kind":"EnumValue","value":"PREPAID"},{"kind":"EnumValue","value":"COLLECTIVE"}]}},{"kind":"Argument","name":{"kind":"Name","value":"includeExpired"},"value":{"kind":"BooleanValue","value":true}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"providerType"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePaymentMethod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"service"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"providerType"}},{"kind":"Field","name":{"kind":"Name","value":"balance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"limitedToHosts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"balance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"limitedToHosts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ContributionFlowPaymentMethodsQuery, ContributionFlowPaymentMethodsQueryVariables>;
export const EditVirtualCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"editVirtualCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"virtualCard"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VirtualCardReferenceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AmountInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitInterval"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"VirtualCardLimitInterval"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assignee"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountReferenceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editVirtualCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"virtualCard"},"value":{"kind":"Variable","name":{"kind":"Name","value":"virtualCard"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"limitAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitAmount"}}},{"kind":"Argument","name":{"kind":"Name","value":"limitInterval"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitInterval"}}},{"kind":"Argument","name":{"kind":"Name","value":"assignee"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assignee"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"spendingLimitAmount"}},{"kind":"Field","name":{"kind":"Name","value":"spendingLimitInterval"}},{"kind":"Field","name":{"kind":"Name","value":"assignee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}}]} as unknown as DocumentNode<EditVirtualCardMutation, EditVirtualCardMutationVariables>;
export const CreateVirtualCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createVirtualCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitAmount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AmountInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitInterval"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"VirtualCardLimitInterval"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"account"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountReferenceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assignee"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountReferenceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createVirtualCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"limitAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitAmount"}}},{"kind":"Argument","name":{"kind":"Name","value":"limitInterval"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitInterval"}}},{"kind":"Argument","name":{"kind":"Name","value":"account"},"value":{"kind":"Variable","name":{"kind":"Name","value":"account"}}},{"kind":"Argument","name":{"kind":"Name","value":"assignee"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assignee"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"last4"}},{"kind":"Field","name":{"kind":"Name","value":"data"}}]}}]}}]} as unknown as DocumentNode<CreateVirtualCardMutation, CreateVirtualCardMutationVariables>;
export const CollectiveMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CollectiveMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"EnumValue","value":"ADMIN"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CollectiveMembersQuery, CollectiveMembersQueryVariables>;
export const VirtualCardPoliciesQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VirtualCardPoliciesQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"policies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"MAXIMUM_VIRTUAL_CARD_LIMIT_AMOUNT_FOR_INTERVAL"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ALL_TIME"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}}]}},{"kind":"Field","name":{"kind":"Name","value":"DAILY"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}}]}},{"kind":"Field","name":{"kind":"Name","value":"MONTHLY"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}}]}},{"kind":"Field","name":{"kind":"Name","value":"PER_AUTHORIZATION"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}}]}},{"kind":"Field","name":{"kind":"Name","value":"WEEKLY"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}}]}},{"kind":"Field","name":{"kind":"Name","value":"YEARLY"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<VirtualCardPoliciesQueryQuery, VirtualCardPoliciesQueryQueryVariables>;
export const TeamSectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamSection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectiveSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"account"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountReferenceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectiveSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isFrozen"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithParent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"features"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"CONTACT_FORM"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"members"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"ADMIN"},{"kind":"EnumValue","value":"MEMBER"},{"kind":"EnumValue","value":"ACCOUNTANT"}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"MemberFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"childrenAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeInherited"},"value":{"kind":"BooleanValue","value":false}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"ADMIN"},{"kind":"EnumValue","value":"MEMBER"},{"kind":"EnumValue","value":"ACCOUNTANT"}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"MemberFields"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"memberInvitations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"account"},"value":{"kind":"Variable","name":{"kind":"Name","value":"account"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"since"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","alias":{"kind":"Name","value":"account"},"name":{"kind":"Name","value":"memberAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"height"},"value":{"kind":"IntValue","value":"64"}}]},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Individual"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]}},...MemberFieldsFragmentDoc.definitions]} as unknown as DocumentNode<TeamSectionQuery, TeamSectionQueryVariables>;
export const CreatePendingContributionModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CreatePendingContributionModal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"host"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isHost"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"plan"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hostFees"}}]}},{"kind":"Field","name":{"kind":"Name","value":"policies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"REQUIRE_2FA_FOR_ADMINS"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hostFeePercent"}},{"kind":"Field","name":{"kind":"Name","value":"isTrustedHost"}}]}}]}}]} as unknown as DocumentNode<CreatePendingContributionModalQuery, CreatePendingContributionModalQueryVariables>;
export const CreatePendingContributionCollectiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CreatePendingContributionCollective"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"slug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"slug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"childrenAccounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"isHost"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithContributions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tiers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithContributions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tiers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CreatePendingContributionCollectiveQuery, CreatePendingContributionCollectiveQueryVariables>;
export const CreatePendingContributionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePendingContribution"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PendingOrderCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPendingOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreatePendingContributionMutation, CreatePendingContributionMutationVariables>;
export const EditPendingContributionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditPendingContribution"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PendingOrderEditInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editPendingOrder"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<EditPendingContributionMutation, EditPendingContributionMutationVariables>;
export const ClearCacheDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearCache"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"account"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountReferenceInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cacheTypes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountCacheType"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearCacheForAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"account"},"value":{"kind":"Variable","name":{"kind":"Name","value":"account"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cacheTypes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ClearCacheMutation, ClearCacheMutationVariables>;
export const OrderPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrderPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"legacyId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectiveSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"order"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"legacyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"legacyId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"processedAt"}},{"kind":"Field","name":{"kind":"Name","value":"hostFeePercent"}},{"kind":"Field","name":{"kind":"Name","value":"pendingContributionData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"expectedAt"}},{"kind":"Field","name":{"kind":"Name","value":"paymentMethod"}},{"kind":"Field","name":{"kind":"Name","value":"ponumber"}},{"kind":"Field","name":{"kind":"Name","value":"memo"}},{"kind":"Field","name":{"kind":"Name","value":"fromAccountInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"memo"}},{"kind":"Field","name":{"kind":"Name","value":"fromAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"toAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"bankTransfersHostFeePercent"},"name":{"kind":"Name","value":"hostFeePercent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paymentMethodType"},"value":{"kind":"EnumValue","value":"MANUAL"}}]}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdByAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsExpired"}},{"kind":"Field","name":{"kind":"Name","value":"canMarkAsPaid"}},{"kind":"Field","name":{"kind":"Name","value":"canEdit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"transactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"order"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"netAmount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paymentProcessorFee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fromAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"toAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectiveSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"twitterHandle"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"expensePolicy"}},{"kind":"Field","name":{"kind":"Name","value":"supportedExpenseTypes"}},{"kind":"Field","name":{"kind":"Name","value":"features"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"NavbarFields"}},{"kind":"Field","name":{"kind":"Name","value":"MULTI_CURRENCY_EXPENSES"}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"country"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"balanceWithBlockedFunds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithParent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"twitterHandle"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AccountWithHost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"twitterHandle"}}]}}]}}]}}]}},...NavbarFieldsFragmentDoc.definitions]} as unknown as DocumentNode<OrderPageQuery, OrderPageQueryVariables>;
export const SubmittedExpensesPageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SubmittedExpensesPage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"collectiveSlug"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExpenseType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tags"}},"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ExpenseStatusFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"minAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"maxAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"payoutMethodType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PayoutMethodType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateFrom"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dateTo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchTerm"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ChronologicalOrderInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectiveSlug"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"legacyId"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"twitterHandle"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"supportedExpenseTypes"}},{"kind":"Field","name":{"kind":"Name","value":"isHost"}},{"kind":"Field","name":{"kind":"Name","value":"features"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"NavbarFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"expenses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createdByAccount"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"slug"},"value":{"kind":"Variable","name":{"kind":"Name","value":"collectiveSlug"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"tag"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tags"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"minAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"minAmount"}}},{"kind":"Argument","name":{"kind":"Name","value":"maxAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"maxAmount"}}},{"kind":"Argument","name":{"kind":"Name","value":"payoutMethodType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"payoutMethodType"}}},{"kind":"Argument","name":{"kind":"Name","value":"dateFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateFrom"}}},{"kind":"Argument","name":{"kind":"Name","value":"dateTo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dateTo"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchTerm"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchTerm"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExpensesListFieldsFragment"}},{"kind":"Field","alias":{"kind":"Name","value":"amountInCreatedByAccountCurrency"},"name":{"kind":"Name","value":"amountV2"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"currencySource"},"value":{"kind":"EnumValue","value":"CREATED_BY_ACCOUNT"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"valueInCents"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"exchangeRate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"isApproximate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"host"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExpenseHostFields"}}]}}]}}]}}]}},...NavbarFieldsFragmentDoc.definitions,...ExpensesListFieldsFragmentFragmentDoc.definitions,...ExpenseHostFieldsFragmentDoc.definitions]} as unknown as DocumentNode<SubmittedExpensesPageQuery, SubmittedExpensesPageQueryVariables>;