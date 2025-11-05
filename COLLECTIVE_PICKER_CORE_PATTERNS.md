# Core Differentiated Patterns for CollectivePicker Usage

After analyzing 27+ usages across the codebase, these are the fundamental patterns that exist:

---

## Pattern 1: Static Profile Selection

**Component:** `CollectivePicker`
**Data:** Prefetched array
**Purpose:** Select from a fixed, known set of options

```tsx
<CollectivePicker collectives={userProfiles} collective={selected} onChange={handleChange} />
```

**Used for:**

- User's own profiles (organizations, collectives)
- Team member selection within a collective
- Parent/child account selection
- Limited option sets where all data is already loaded

**Key characteristics:**

- No API calls needed
- Fast, immediate display
- Usually smaller option sets (< 50 items)
- May enable `groupByType` for organization
- May enable `creatable` for inline profile creation

**Examples:**

- WhoIsGettingPaidSection: other profiles
- ContributeProfilePicker: user profiles with incognito
- EditExpenseDialog: move destination accounts

---

## Pattern 2: Simple Search & Select

**Component:** `CollectivePickerAsync`
**Data:** Query only
**Purpose:** Search across a large dataset with filters

```tsx
<CollectivePickerAsync types={['COLLECTIVE', 'FUND']} hostCollectiveIds={[hostId]} onChange={handleChange} />
```

**Used for:**

- Selecting hosted collectives
- Account selection in admin flows
- Searching across many options

**Key characteristics:**

- No prefetched data
- Search-driven interaction
- Type and host scoping common
- Lazy loading (search on type)
- Often uses `preload={true}` for immediate display

**Examples:**

- WhoIsPayingSection: find account
- CreatePendingOrderModal: recipient selection
- HostCreateExpenseModal: account selection (when no defaults)

---

## Pattern 3: Quick Access + Search

**Component:** `CollectivePickerAsync`
**Data:** Query + `defaultCollectives`
**Purpose:** Show common options immediately, enable search for others

```tsx
<CollectivePickerAsync
  defaultCollectives={[account, ...account.children]}
  hostCollectiveIds={[hostId]}
  onChange={handleChange}
/>
```

**Used for:**

- Selecting from related accounts (parent/children)
- Showing recent or relevant items first
- Balancing speed with flexibility

**Key characteristics:**

- Hybrid approach: prefetched + searchable
- Shows defaults when no search term
- Switches to API results when searching
- Merges both when loading completes
- Best UX for "common case + everything else" scenarios

**Examples:**

- InternalTransferModal: from/to account selection
- HostCreateExpenseModal: account selection (with array)

---

## Pattern 4: Recommended Options + Search

**Component:** `CollectivePickerAsync`
**Data:** Query + `customOptions`
**Purpose:** Prioritize recommended items while allowing search

```tsx
<CollectivePickerAsync
  types={['USER', 'ORGANIZATION', 'VENDOR']}
  customOptions={[
    {
      label: 'Recommended Vendors',
      options: vendors.map(v => ({ value: v, label: v.name })),
    },
  ]}
  includeVendorsForHostId={hostId}
  onChange={handleChange}
/>
```

**Used for:**

- Expense source/payee selection with recommended vendors
- Showing host as an option
- Organizing options by priority or category

**Key characteristics:**

- Custom options shown separately (TOP or BOTTOM)
- Often grouped by type
- Vendors + host are common custom options
- Search still works across all options
- `customOptionsPosition` controls placement

**Examples:**

- AddFundsModal: source with vendors + host
- CreatePendingOrderModal: source with vendors + host
- HostCreateExpenseModal: payee with vendors + host
- AssignVirtualCardModal: collective with host

---

## Pattern 5: Create or Invite Flow

**Component:** `CollectivePickerAsync`
**Data:** Query
**Purpose:** Select existing OR create/invite new

```tsx
<CollectivePickerAsync
  types={['USER', 'VENDOR']}
  creatable={['USER', 'VENDOR']}
  includeVendorsForHostId={hostId}
  HostCollectiveId={hostId}
  onChange={handleChange}
/>
```

**Variant A - Creatable:**

```tsx
creatable={['USER', 'VENDOR']}
// Shows inline creation form
```

**Variant B - Invitable:**

```tsx
invitable={true}
onInvite={handleInvite}
// Shows invitation flow
```

**Used for:**

- Expense payee selection (create vendor/user)
- Team member invitation
- Organization creation in contribution flow

**Key characteristics:**

- Enables inline account creation
- `creatable` for immediate creation
- `invitable` for invitation workflow
- Often restricted to specific types
- May use `addLoggedInUserAsAdmin` and `excludeAdminFields`

**Examples:**

- WhoIsGettingPaidSection: vendor creation (creatable)
- ExpenseFormPayeeStep: payee with invitation (invitable)
- InviteMemberModal: user creation (creatable)
- ApplyToHostModal: organization creation (creatable)

---

## Pattern 6: Pre-organized Options Menu

**Component:** `CollectivePicker` with `creatable`
**Data:** Prefetched + inline creation
**Purpose:** Organized menu of user's profiles with creation option

```tsx
<CollectivePicker
  options={[
    { label: 'Myself', options: [personalProfile] },
    { label: 'My Organizations', options: [...orgs, createNewOption] },
  ]}
  creatable={true}
  types={[ORGANIZATION]}
  formatOptionLabel={customFormatter}
  onChange={handleChange}
/>
```

**Used for:**

- Contribution profile selection
- Organized display by profile type
- Custom option rendering (e.g., incognito)

**Key characteristics:**

- Pre-built option structure
- Custom sections/labels
- Often includes special options (incognito, create new)
- Custom `formatOptionLabel` for rich display
- No search needed (small set)

**Examples:**

- ContributeProfilePicker: user profiles with incognito
- ApplyToHostModal: collective selection

---

## Pattern 7: Multi-Select Configuration

**Component:** `CollectivePicker` or `CollectivePickerAsync`
**Data:** Either prefetched or query
**Purpose:** Select multiple items for configuration

```tsx
<CollectivePicker
  isMulti={true}
  collectives={hosts}
  defaultValue={selected}
  onChange={handleMultiChange}
  useCompactMode={selected.length >= 3}
/>
```

**Used for:**

- Admin configuration (vendor visibility)
- Gift card host limitations
- Bulk operations

**Key characteristics:**

- `isMulti={true}` enabled
- Returns array of selections
- May use `useCompactMode` for many selections
- Often `groupByType={false}` for simpler display
- Used infrequently (only ~2 cases in codebase)

**Examples:**

- VendorForm: visible to accounts
- CreateGiftCardsForm: limit to hosts

---

## Pattern 8: Paginated/Organized Options Display

**Component:** `CollectivePickerAsync`
**Data:** Query with `emptyCustomOptions`
**Purpose:** Show organized empty state, search for everything

```tsx
<CollectivePickerAsync
  emptyCustomOptions={[
    { label: 'Myself', options: myProfiles },
    { label: 'Vendors', options: vendors },
    { label: 'My Organizations', options: orgs },
  ]}
  customOptionsPosition={CUSTOM_OPTIONS_POSITION.BOTTOM}
  invitable={true}
  includeVendorsForHostId={hostId}
  onChange={handleChange}
/>
```

**Used for:**

- Complex payee selection
- Organized display before search
- Combining multiple data sources

**Key characteristics:**

- `emptyCustomOptions` for organized display when no search
- Search replaces organized view
- Combines prefetched user data + searchable API
- Often used with `invitable` or `creatable`
- Custom positioning of options

**Examples:**

- ExpenseFormPayeeStep: comprehensive payee selection

---

## Pattern Comparison Matrix

| Pattern                     | Component             | Data Source           | Search   | Creation | Multi | Typical Use Case                |
| --------------------------- | --------------------- | --------------------- | -------- | -------- | ----- | ------------------------------- |
| 1. Static Profile Selection | CollectivePicker      | Prefetched            | No       | Optional | No    | User's profiles, team members   |
| 2. Simple Search & Select   | CollectivePickerAsync | Query                 | Yes      | No       | No    | Account selection, broad search |
| 3. Quick Access + Search    | CollectivePickerAsync | Query + defaults      | Yes      | No       | No    | Related accounts with search    |
| 4. Recommended + Search     | CollectivePickerAsync | Query + custom        | Yes      | Optional | No    | Vendors, hosts, recommendations |
| 5. Create or Invite         | CollectivePickerAsync | Query                 | Yes      | Yes      | No    | Payee, vendor, team member      |
| 6. Pre-organized Menu       | CollectivePicker      | Prefetched            | No       | Yes      | No    | Contribution profiles           |
| 7. Multi-Select Config      | Either                | Either                | Optional | No       | Yes   | Admin configuration             |
| 8. Paginated Display        | CollectivePickerAsync | Query + empty options | Yes      | Yes      | No    | Complex payee selection         |

---

## Decision Tree

```
Do you have all the data already?
├─ YES: Is it a small set (< 50 items)?
│  ├─ YES: Need multiple selection?
│  │  ├─ YES → Pattern 7: Multi-Select Configuration
│  │  └─ NO: Need creation?
│  │     ├─ YES → Pattern 6: Pre-organized Options Menu
│  │     └─ NO → Pattern 1: Static Profile Selection
│  └─ NO: Need search
│     └─ → Pattern 3: Quick Access + Search (use as defaultCollectives)
│
└─ NO: Need to search/query
   ├─ Need to show recommendations?
   │  └─ YES → Pattern 4: Recommended Options + Search
   ├─ Need creation/invitation?
   │  └─ YES → Pattern 5: Create or Invite Flow
   ├─ Need organized empty state?
   │  └─ YES → Pattern 8: Paginated/Organized Display
   ├─ Want to show some items immediately?
   │  └─ YES → Pattern 3: Quick Access + Search
   └─ Simple search
      └─ → Pattern 2: Simple Search & Select
```

---

## Common Prop Combinations by Pattern

### Pattern 1: Static Profile Selection

```tsx
{
  collectives: Array,
  collective: Object,
  groupByType: boolean,
  isSearchable: boolean, // if > 8-10 items
  creatable: boolean,     // optional
}
```

### Pattern 2: Simple Search & Select

```tsx
{
  types: Array,
  hostCollectiveIds: Array,  // often present
  preload: boolean,          // often true
  filterResults: Function,   // optional
}
```

### Pattern 3: Quick Access + Search

```tsx
{
  defaultCollectives: Array,
  hostCollectiveIds: Array,
  parentCollectiveIds: Array,
  includeArchived: boolean,
}
```

### Pattern 4: Recommended + Search

```tsx
{
  types: Array,
  customOptions: Array,
  customOptionsPosition: 'TOP' | 'BOTTOM',
  includeVendorsForHostId: number,
}
```

### Pattern 5: Create or Invite

```tsx
{
  // Creatable variant:
  creatable: Array,
  HostCollectiveId: number,
  addLoggedInUserAsAdmin: boolean,
  excludeAdminFields: boolean,

  // Invitable variant:
  invitable: boolean,
  onInvite: Function,
}
```

### Pattern 6: Pre-organized Menu

```tsx
{
  options: Array,          // pre-structured
  creatable: boolean,
  formatOptionLabel: Function,
  types: Array,            // for creation
}
```

### Pattern 7: Multi-Select

```tsx
{
  isMulti: true,
  useCompactMode: boolean,
  groupByType: false,      // usually
  defaultValue: Array,
}
```

### Pattern 8: Paginated Display

```tsx
{
  emptyCustomOptions: Array,
  customOptionsPosition: 'BOTTOM',
  invitable: boolean,
  includeVendorsForHostId: number,
  filterResults: Function,
}
```

---

## Key Insights

1. **Most common pattern**: Pattern 4 (Recommended + Search) - used in ~40% of cases for expense/fund flows
2. **Best UX pattern**: Pattern 3 (Quick Access + Search) - combines speed with flexibility
3. **Rarely used**: Pattern 7 (Multi-Select) - only 2 instances in entire codebase
4. **Most complex**: Pattern 8 (Paginated Display) - only used once, in ExpenseFormPayeeStep

5. **CollectivePicker vs CollectivePickerAsync usage:**
   - CollectivePicker: ~30% of cases (9/27)
   - CollectivePickerAsync: ~70% of cases (18/27)
   - Hybrid (Async with defaults): ~25% of cases (7/27)

6. **Common features across patterns:**
   - Host scoping (`hostCollectiveIds`) appears in ~60% of cases
   - Type filtering (`types`) appears in ~70% of cases
   - Creation (`creatable`/`invitable`) appears in ~40% of cases
   - Custom options appear in ~30% of cases
