/**
 * Builders for `ExpenseFormSchema` query responses. They only include the fields the Expense form
 * reads; the rest of the query selection is left out on purpose.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

type Fixture = Record<string, any>;

const policies = (overrides: Fixture = {}) => ({
  __typename: 'Policies',
  id: 'policies',
  COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS: false,
  EXPENSE_CATEGORIZATION: { requiredForExpenseSubmitters: false, requiredForCollectiveAdmins: false },
  EXPENSE_POLICIES: { invoicePolicy: null, receiptPolicy: null, titlePolicy: null, grantPolicy: null },
  USE_VENDOR_POLICY: null,
  ...overrides,
});

const features = (overrides: Fixture = {}) => ({
  __typename: 'CollectiveFeatures',
  id: 'features',
  MULTI_CURRENCY_EXPENSES: 'AVAILABLE',
  PAYPAL_PAYOUTS: 'DISABLED',
  CHART_OF_ACCOUNTS: 'DISABLED',
  PAYPAL_CONNECT: 'DISABLED',
  TAX_FORMS: 'DISABLED',
  ...overrides,
});

export const payoutMethod = (overrides: Fixture = {}) => ({
  __typename: 'PayoutMethod',
  id: 'pm-bank-usd',
  type: 'BANK_ACCOUNT',
  name: 'My bank',
  data: { currency: 'USD', accountHolderName: 'Jane Doe' },
  isSaved: true,
  canBeEdited: true,
  canBeDeleted: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  isVerified: false,
  ...overrides,
});

export const host = (overrides: Fixture = {}) => ({
  __typename: 'Host',
  id: 'host-1',
  legacyId: 1001,
  publicId: 'host-1-public',
  name: 'Host One',
  legalName: 'Host One Inc',
  slug: 'host-one',
  type: 'ORGANIZATION',
  currency: 'USD',
  settings: {},
  isFirstPartyHost: false,
  isTrustedHost: false,
  location: { __typename: 'Location', id: 'loc-host', address: null, country: 'US' },
  transferwise: null,
  supportedPayoutMethods: ['BANK_ACCOUNT', 'OTHER', 'PAYPAL', 'ACCOUNT_BALANCE'],
  expensesTags: [],
  payoutMethods: [],
  policies: policies(),
  features: features(),
  accountingCategories: { __typename: 'AccountingCategoryCollection', nodes: [] },
  vendorsForAccount: { __typename: 'VendorCollection', nodes: [] },
  vendors: { __typename: 'VendorCollection', totalCount: 0 },
  ...overrides,
});

const accountBase = (typename: string, overrides: Fixture) => ({
  __typename: typename,
  id: `${overrides.slug}-id`,
  publicId: `${overrides.slug}-public`,
  legacyId: 1,
  name: overrides.slug,
  legalName: null,
  isUSEntity: null,
  slug: overrides.slug,
  currency: 'USD',
  settings: {},
  supportedExpenseTypes: ['INVOICE', 'RECEIPT'],
  isVerified: false,
  isAdmin: false,
  isHost: false,
  isArchived: false,
  hasPublicProfile: true,
  description: null,
  imageUrl: null,
  stats: { __typename: 'AccountStats', id: `${overrides.slug}-stats`, balance: { valueInCents: 0, currency: 'USD' } },
  policies: policies(),
  features: features(),
  admins: { __typename: 'MemberCollection', totalCount: 0, nodes: [] },
  payoutMethods: [],
  location: { __typename: 'Location', address: null, country: null },
  ...overrides,
});

export const collective = (overrides: Fixture = {}) =>
  accountBase('Collective', { slug: 'collective', type: 'COLLECTIVE', host: host(), approvedAt: null, ...overrides });

export const individual = (overrides: Fixture = {}) =>
  accountBase('Individual', { slug: 'jane', type: 'INDIVIDUAL', name: 'Jane Doe', isGuest: false, ...overrides });

export const organization = (overrides: Fixture = {}) =>
  accountBase('Organization', { slug: 'org', type: 'ORGANIZATION', hasHosting: false, host: null, ...overrides });

export const vendor = (overrides: Fixture = {}) =>
  accountBase('Vendor', {
    slug: 'vendor',
    type: 'VENDOR',
    name: 'Vendor Ltd',
    hasPayoutMethod: true,
    vendorInfo: { __typename: 'VendorInfo', taxId: null, taxType: null },
    canBeUsedWithAccounts: [],
    ...overrides,
  });

/** `loggedInAccount` fragment: an Individual with its payout methods and administered accounts. */
export const loggedInAccount = (overrides: Fixture = {}, adminOf: Fixture[] = []) =>
  individual({
    legacyId: 42,
    hasTwoFactorAuth: false,
    payoutMethods: [payoutMethod()],
    adminMemberships: {
      __typename: 'MemberCollection',
      nodes: adminOf.map((account, i) => ({
        __typename: 'Member',
        id: `membership-${i}`,
        account: { isActive: true, childrenAccounts: { nodes: [] }, ...account },
      })),
    },
    ...overrides,
  });

export const expenseItem = (overrides: Fixture = {}) => ({
  __typename: 'ExpenseItem',
  id: 'item-1',
  description: 'Item one',
  url: null,
  file: null,
  amount: { __typename: 'Amount', currency: 'USD', valueInCents: 10000, exchangeRate: null },
  createdAt: '2025-03-01T00:00:00Z',
  incurredAt: '2025-03-01T00:00:00Z',
  ...overrides,
});

export const existingExpense = (overrides: Fixture = {}) => ({
  __typename: 'Expense',
  id: 'expense-1',
  legacyId: 555,
  description: 'Existing expense',
  createdAt: '2025-03-01T00:00:00Z',
  longDescription: null,
  amountV2: { valueInCents: 10000, currency: 'USD' },
  taxes: [],
  requiredLegalDocuments: [],
  accountingCategory: null,
  currency: 'USD',
  type: 'INVOICE',
  status: 'PENDING',
  account: collective(),
  createdByAccount: individual(),
  payee: individual(),
  payoutMethod: { __typename: 'PayoutMethod', id: 'pm-bank-usd', data: { currency: 'USD' } },
  attachedFiles: [],
  invoiceFile: null,
  items: [expenseItem()],
  privateMessage: null,
  invoiceInfo: null,
  reference: null,
  tags: [],
  permissions: {
    __typename: 'ExpensePermissions',
    id: 'perms',
    canEdit: true,
    canEditAccountingCategory: true,
    canEditTags: true,
    canDeclineExpenseInvite: false,
  },
  draft: null,
  lockedFields: [],
  submitter: individual(),
  ...overrides,
});
