# CollectivePicker Stories Documentation

This document provides an overview of all the Storybook stories created for `CollectivePicker` and `CollectivePickerAsync` components.

## Story Structure

The stories are organized into three main sections:

### 1. Basic CollectivePicker Stories

**Location:** `Components/CollectivePicker`

These stories demonstrate the core functionality and prop variations of the base `CollectivePicker` component:

- **Default** - Basic picker with search and grouping
- **WithSelection** - Picker with a pre-selected collective
- **MultiSelect** - Multi-selection mode
- **WithoutGrouping** - Flat list without type grouping
- **WithCreateOption** - Shows "Create new" option
- **WithInviteOption** - Shows "Invite new" option
- **WithCreateAndInvite** - Both create and invite options
- **FilteredByType** - Filtered to show only users
- **OrganizationsOnly** - Only organization type
- **CollectivesOnly** - Only collective type
- **VendorsOnly** - Only vendor type with creation
- **MultipleTypes** - Filter for users and organizations
- **Disabled** - Disabled state
- **EmptyState** - No collectives available
- **NotSearchable** - Search disabled
- **LargeDataset** - Performance test with 100+ items
- **CustomWidth** - Custom width demonstration
- **MinMaxWidth** - Min/max width constraints
- **WithCustomOptions** - Custom options demonstration

### 2. CollectivePickerAsync Stories

**Location:** `Components/CollectivePicker/Async`

Basic async functionality stories:

- **AsyncDefault** - Basic async picker with preload
- **AsyncWithTypes** - Type-filtered async search
- **AsyncWithDefaultCollectives** - Hybrid mode with default collectives

### 3. Real-World Use Case Stories

These stories mirror actual platform usage patterns documented in `COLLECTIVE_PICKER_USAGE.csv` and `COLLECTIVE_PICKER_USAGE.md`:

#### Add Funds Modal

- **AddFundsSourcePicker** - Source selection with vendors and host
- **AddFundsRecipientPicker** - Recipient from parent/children accounts
- **AddFundsCollectiveSelector** - Collective selection with host filter

#### Internal Transfer

- **InternalTransferFromAccount** - Source account with archived support
- **InternalTransferToAccount** - Destination account (filtered)

#### Expense & Payee

- **ExpensePayeeSelection** - Payee selection with invitable and profiles
- **VendorSelection** - Vendor selection with creation
- **VendorVisibilityMultiSelect** - Multi-select for vendor visibility

#### Virtual Cards

- **VirtualCardCollectiveSelection** - Collective assignment (active only)
- **VirtualCardAssigneeSelection** - User assignee selection

#### Host Application

- **ApplyToHostCollectiveSelection** - Collective selection with creation
- **ApplyToHostInviteAdmins** - Admin invitation

#### Orders & Contributions

- **GiftCardHostLimitation** - Multi-select host limitation
- **PendingOrderRecipient** - Order recipient selection
- **PendingOrderChildAccount** - Child account with "None" option
- **ContributeProfileSelection** - Profile with incognito option

#### Team Management

- **InviteMemberSelection** - Member invitation with filtering

#### Other Use Cases

- **HostOrganizationSelection** - Host-only filtered selection
- **OtherProfilesSelection** - User's other profiles
- **MoveExpenseDestination** - Expense move destination

## Usage Patterns Covered

### Data Source Patterns

1. **Prefetched (CollectivePicker)** - Fixed list of collectives
2. **Query (CollectivePickerAsync)** - Dynamic API search
3. **Hybrid (CollectivePickerAsync)** - Default collectives + API search
4. **Custom Options** - Static options alongside searchable results

### Feature Combinations

- Single vs Multi-select
- Creatable (new accounts/users/vendors)
- Invitable (email invitations)
- Type filtering
- Host scoping
- Result filtering
- Grouping by type
- Custom option positioning

### Mock Data

The stories use representative mock data for:

- Users and profiles
- Organizations
- Collectives, Funds, Events, Projects
- Vendors
- Host organizations
- Active/archived accounts

## Running the Stories

To view these stories in Storybook:

```bash
npm run storybook
```

Navigate to:

- `Components/CollectivePicker` for basic stories
- `Components/CollectivePicker/Async` for async stories

All real-world use case stories are included in the async section as they primarily use `CollectivePickerAsync` or demonstrate specific `CollectivePicker` configurations.

## Testing Considerations

When testing with these stories:

1. **Basic functionality** - Use the simple stories in the main section
2. **Async behavior** - Note that API calls are mocked in Storybook
3. **Real usage patterns** - Refer to the use case stories to understand actual implementation patterns
4. **Props combinations** - Each story documents which props work together

## Related Documentation

- `COLLECTIVE_PICKER_USAGE.csv` - Usage matrix across the platform
- `COLLECTIVE_PICKER_USAGE.md` - Detailed usage patterns and analysis
- `COLLECTIVE_PICKER_CORE_PATTERNS.md` - Core patterns and conventions

## Story Count

- **CollectivePicker**: 19 stories
- **CollectivePickerAsync Basic**: 3 stories
- **Real-World Use Cases**: 21 stories
- **Total**: 43 stories
