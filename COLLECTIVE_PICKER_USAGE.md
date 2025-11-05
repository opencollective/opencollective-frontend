# CollectivePicker and CollectivePickerAsync Usage Documentation

This document provides a comprehensive analysis of how `CollectivePicker` and `CollectivePickerAsync` are used throughout the Open Collective frontend codebase.

## Component Overview

### CollectivePicker

- Base component for selecting collectives from a **predefined/prefetched list**
- Requires `collectives` prop with the array of options
- Used when data is already loaded or a limited set of options is available

### CollectivePickerAsync

- Extends CollectivePicker functionality with **API-based search**
- Fetches collectives dynamically based on user input
- Can work with optional `defaultCollectives` for immediate display
- Supports both **prefetched data AND query** simultaneously

---

## Usage Matrix

| Component                                       | Data Source                               | Invitable | Creatable               | Multi | Types                                                    | Notes                                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------- | --------- | ----------------------- | ----- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **AddFundsModal.tsx**                           |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (source)              | Query + Custom Options (vendors, host)    | ❌        | `['USER', 'VENDOR']`    | ❌    | `['USER', 'ORGANIZATION', 'VENDOR']`                     | Uses custom options for recommended vendors + host                                                                                          |
| → `CollectivePicker` (recipient)                | Prefetched (account + children)           | ❌        | ❌                      | ❌    | -                                                        | For selecting recipient account from parent/children                                                                                        |
| → `CollectivePickerAsync` (collective selector) | Query                                     | ❌        | ❌                      | ❌    | `['COLLECTIVE', 'PROJECT', 'EVENT', 'FUND']`             | With custom host option, hostCollectiveIds filter                                                                                           |
| **InternalTransferModal.tsx**                   |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (from)                | Query + Default (activeAccounts)          | ❌        | ❌                      | ❌    | -                                                        | Custom search query, includeArchived=true, parentCollectiveIds filter                                                                       |
| → `CollectivePickerAsync` (to)                  | Query + Default (activeAccounts)          | ❌        | ❌                      | ❌    | -                                                        | Filters out selected fromAccount                                                                                                            |
| **WhoIsPayingSection.tsx**                      |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync`                       | Query                                     | ❌        | ❌                      | ❌    | `[COLLECTIVE, EVENT, FUND, ORGANIZATION, PROJECT]`       | Filters to show only HOST organizations, used in radio card                                                                                 |
| **WhoIsGettingPaidSection.tsx**                 |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePicker` (other profiles)           | Prefetched (myProfiles)                   | ❌        | ❌                      | ❌    | -                                                        | For selecting from user's other administered accounts                                                                                       |
| → `CollectivePickerAsync` (invite)              | Query                                     | ✅        | ❌                      | ❌    | `[COLLECTIVE, EVENT, FUND, ORGANIZATION, PROJECT, USER]` | Invitable for expense payee selection                                                                                                       |
| → `CollectivePickerAsync` (vendor)              | Query + Default (vendorsForAccount)       | ❌        | `['VENDOR']` (if admin) | ❌    | `['VENDOR']`                                             | includeVendorsForHostId, handleCreateForm                                                                                                   |
| **VendorForm.tsx**                              |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (visibility)          | Query                                     | ❌        | ❌                      | ✅    | -                                                        | Multi-select for vendor visibility, hostCollectiveIds filter, filterResults                                                                 |
| **EditExpenseDialog.tsx**                       |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePicker` (move destination)         | Prefetched (activeAccounts)               | ❌        | ❌                      | ❌    | -                                                        | For moving expense between accounts                                                                                                         |
| **AssignVirtualCardModal.js**                   |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (collective)          | Query + Custom (host)                     | ❌        | ❌                      | ❌    | -                                                        | hostCollectiveIds filter, filterResults for active only                                                                                     |
| → `CollectivePicker` (assignee)                 | Prefetched (collectiveUsers)              | ❌        | ❌                      | ❌    | -                                                        | groupByType=false                                                                                                                           |
| **EditVirtualCardModal.tsx**                    |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (collective)          | Query + Custom (host)                     | ❌        | ❌                      | ❌    | -                                                        | hostCollectiveIds filter, filterResults for active only                                                                                     |
| → `CollectivePicker` (assignee)                 | Prefetched (collectiveUsers)              | ❌        | ❌                      | ❌    | -                                                        | groupByType=false                                                                                                                           |
| **ApplyToHostModal.js**                         |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePicker` (collective selection)     | Prefetched (user's admin collectives)     | ❌        | ✅                      | ❌    | `['COLLECTIVE']`                                         | renderNewCollectiveOption custom, for host application                                                                                      |
| → `CollectivePickerAsync` (invite admins)       | Query                                     | ❌        | ✅                      | ❌    | `['USER']`                                               | Creatable for inviting team members, filterResults to exclude existing                                                                      |
| **CreateGiftCardsForm.js**                      |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePicker` (limit to hosts)           | Prefetched (hosts)                        | ❌        | ❌                      | ✅    | -                                                        | Multi-select, sortFunc bypassed, groupByType=false, useCompactMode                                                                          |
| **CreatePendingOrderModal.tsx**                 |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (recipient)           | Query                                     | ❌        | ❌                      | ❌    | `['COLLECTIVE', 'ORGANIZATION', 'FUND']`                 | hostCollectiveIds, preload=true                                                                                                             |
| → `CollectivePicker` (child account)            | Prefetched (childrenAccounts)             | ❌        | ❌                      | ❌    | -                                                        | With custom "None" option                                                                                                                   |
| → `CollectivePickerAsync` (source)              | Query + Custom (vendors, host)            | ❌        | `['USER', 'VENDOR']`    | ❌    | `['USER', 'ORGANIZATION', 'VENDOR']`                     | includeVendorsForHostId, custom options for recommended vendors                                                                             |
| **HostCreateExpenseModal.tsx**                  |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePicker` (account)                  | Prefetched (array of accounts)            | ❌        | ❌                      | ❌    | -                                                        | When multiple accounts provided                                                                                                             |
| → `CollectivePickerAsync` (account)             | Query                                     | ❌        | ❌                      | ❌    | -                                                        | When no accounts or single account, hostCollectiveIds, preload=true                                                                         |
| → `CollectivePickerAsync` (payee)               | Query + Custom (vendors, host)            | ❌        | `['USER', 'VENDOR']`    | ❌    | `['USER', 'ORGANIZATION', 'VENDOR', 'PROJECT']`          | Custom PayeeSelect wrapper, includeVendorsForHostId                                                                                         |
| **ExpenseFormPayeeStep.js**                     |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (payee)               | Query + Custom (payoutProfiles + vendors) | ✅        | ❌                      | ❌    | -                                                        | emptyCustomOptions (organized by type), customOptionsPosition=BOTTOM, invitable, custom searchQuery, filterResults, includeVendorsForHostId |
| **ContributeProfilePicker.js**                  |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePicker` (profile)                  | Prefetched (profiles)                     | ❌        | ✅                      | ❌    | `[ORGANIZATION]`                                         | addLoggedInUserAsAdmin, excludeAdminFields, custom formatOptionLabel, includes incognito option                                             |
| **InviteMemberModal.js**                        |                                           |           |                         |       |                                                          |                                                                                                                                             |
| → `CollectivePickerAsync` (member)              | Query                                     | ❌        | ✅                      | ❌    | `[USER]`                                                 | filterResults to exclude existing members, menuPortalTarget=null                                                                            |

---

## Key Patterns & Use Cases

### 1. **Prefetched Data Only (CollectivePicker)**

**When used:**

- Selecting from a fixed set of user's profiles
- Choosing between parent/child accounts
- Selecting team members from a collective
- Gift card host limitations

**Example:**

```tsx
<CollectivePicker collectives={myProfiles} collective={selectedProfile} onChange={handleChange} />
```

### 2. **API Query Only (CollectivePickerAsync)**

**When used:**

- Search across many collectives
- Type-filtered searches
- Host-scoped searches

**Example:**

```tsx
<CollectivePickerAsync types={['COLLECTIVE', 'EVENT']} hostCollectiveIds={[hostId]} onChange={handleChange} />
```

### 3. **Hybrid: Query + Default Collectives (CollectivePickerAsync)**

**When used:**

- Showing recommended options immediately
- Providing quick access to frequently used items
- Combining prefetched favorites with searchable full list

**Example:**

```tsx
<CollectivePickerAsync
  defaultCollectives={[account, ...account.children]}
  includeArchived={true}
  parentCollectiveIds={[parentId]}
  onChange={handleChange}
/>
```

### 4. **Custom Options Pattern (CollectivePickerAsync)**

**When used:**

- Adding host as an option
- Showing recommended vendors
- Organizing options by type

**Example:**

```tsx
<CollectivePickerAsync
  customOptions={[
    {
      label: 'Fiscal Host',
      options: [{ value: host, label: host.name }],
    },
  ]}
  types={['COLLECTIVE', 'PROJECT']}
  onChange={handleChange}
/>
```

---

## Feature Usage Summary

### `invitable` Prop

**Used in:**

- WhoIsGettingPaidSection (expense payee selection)
- ExpenseFormPayeeStep (expense form)

**Purpose:** Allows creating invitation flows for users not yet in the system

### `creatable` Prop

**Used in:**

- Most expense-related flows (`['USER', 'VENDOR']`)
- Team member invitations (`['USER']`)
- Organization creation in contribution flow (`[ORGANIZATION]`)
- Host application flow (`[COLLECTIVE]`)

**Purpose:** Enables inline creation of new accounts/profiles

### `isMulti` Prop

**Used in:**

- VendorForm (visible to accounts)
- CreateGiftCardsForm (limit to hosts)

**Purpose:** Multiple selection mode

### Host-Scoped Searches

**Common pattern:**

```tsx
hostCollectiveIds={[host.legacyId]}
includeVendorsForHostId={host.legacyId}
```

**Used in:** Most admin/host features to scope searches to hosted collectives

### Vendor-Specific Features

```tsx
types={['VENDOR']}
includeVendorsForHostId={hostId}
vendorVisibleToAccountIds={[accountId]}
useBeneficiaryForVendor={true}  // for grants
```

---

## Query Strategies

### 1. **Preload Strategy**

```tsx
<CollectivePickerAsync preload={true} />
```

- Triggers search on mount with empty term
- Used when immediate display of options is needed

### 2. **Lazy Load Strategy**

```tsx
<CollectivePickerAsync preload={false} />
```

- Only searches when user types
- Default behavior
- Used for large datasets

### 3. **Default Collectives Strategy**

```tsx
<CollectivePickerAsync defaultCollectives={accounts} />
```

- Shows prefetched data when no search term
- Switches to API results when searching
- Merges both when loading completes
- Best of both worlds

### 4. **Custom Query**

```tsx
<CollectivePickerAsync searchQuery={customQuery} />
```

- Used for specialized search requirements
- Examples: specific fields, custom filters

---

## Common Props Combinations

### Expense Payee Selection

```tsx
<CollectivePickerAsync
  types={['USER', 'ORGANIZATION', 'VENDOR']}
  invitable={true}
  creatable={['USER', 'VENDOR']}
  includeVendorsForHostId={hostId}
  customOptions={recommendedVendorsOptions}
/>
```

### Account Selection (Host Admin)

```tsx
<CollectivePickerAsync hostCollectiveIds={[hostId]} types={['COLLECTIVE', 'FUND', 'PROJECT', 'EVENT']} preload={true} />
```

### User Profile Selection

```tsx
<CollectivePicker collectives={userProfiles} groupByType={true} creatable={[ORGANIZATION]} excludeAdminFields={true} />
```

### Virtual Card Assignment

```tsx
<CollectivePickerAsync
  hostCollectiveIds={[hostId]}
  filterResults={c => c.isActive}
  customOptions={[{ value: host, label: host.name }]}
/>
```

---

## Special Configurations

### `menuPortalTarget={null}`

- Renders menu in local DOM instead of body portal
- Used in modals/drawers to prevent z-index issues

### `filterResults`

- Client-side filtering of API results
- Common filters: `isActive`, admin memberships, exclude existing

### `customOptionsPosition`

- `TOP` or `BOTTOM`
- Controls where custom options appear relative to search results

### `formatOptionLabel`

- Custom rendering of option items
- Used in ContributeProfilePicker for incognito display

### `renderNewCollectiveOption`

- Custom UI for "create new" option
- Used in ApplyToHostModal

---

## Notes

1. **Both prefetched AND query pattern** is common in `CollectivePickerAsync` using `defaultCollectives`
2. **Most invitable usages** are in expense/payee flows
3. **Creatable** is heavily used for USER and VENDOR types
4. **Multi-select** is rare, mainly for admin configuration (2 cases found)
5. **Host scoping** is the most common filter pattern
6. **Vendor support** has dedicated props and flows (beneficiary vs vendor)
7. **Type filtering** is used in almost every CollectivePickerAsync instance
8. **Custom options** pattern is common for showing recommended/priority items

---

## Migration Considerations

If refactoring these components, consider:

- The hybrid query + defaults pattern is widely used
- Host-scoping is critical for admin features
- Vendor flows have special requirements
- Custom options for recommendations are common
- Portal target configuration needed for modals
- Filter results callback is frequently used
- Both sync (CollectivePicker) and async (CollectivePickerAsync) modes are needed
