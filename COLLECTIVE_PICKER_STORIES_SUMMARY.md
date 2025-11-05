# CollectivePicker Stories - Implementation Summary

## What Was Created

I've created comprehensive Storybook stories for both `CollectivePicker` and `CollectivePickerAsync` components that mirror all real-world usage patterns documented in your codebase.

## Files Created/Modified

### Modified

- **`components/CollectivePicker.stories.tsx`** - Expanded from basic stories to comprehensive coverage (43 total stories)

### New Documentation

- **`COLLECTIVE_PICKER_STORIES.md`** - Complete documentation of all stories
- **`COLLECTIVE_PICKER_STORIES_SUMMARY.md`** - This file

## Story Breakdown

### 1. Basic CollectivePicker Stories (19 stories)

Located under `Components/CollectivePicker` in Storybook:

- **Core Functionality**
  - Default, WithSelection, MultiSelect
  - WithoutGrouping, NotSearchable
  - CustomWidth, MinMaxWidth

- **Feature Variations**
  - WithCreateOption, WithInviteOption, WithCreateAndInvite
  - Disabled, EmptyState

- **Type Filtering**
  - FilteredByType, OrganizationsOnly, CollectivesOnly, VendorsOnly, MultipleTypes

- **Performance & Edge Cases**
  - LargeDataset (100+ items)
  - WithCustomOptions

### 2. CollectivePickerAsync Stories (3 basic + 21 use cases)

#### Basic Async Stories

Located under `Components/CollectivePicker/Async`:

- **AsyncDefault** - Basic async with preload
- **AsyncWithTypes** - Type-filtered search
- **AsyncWithDefaultCollectives** - Hybrid mode (prefetched + search)

#### Real-World Use Case Stories (21 stories)

Each story represents an actual platform implementation:

**Add Funds Modal** (3 stories)

- AddFundsSourcePicker - Source with vendors and host
- AddFundsRecipientPicker - Recipient from account hierarchy
- AddFundsCollectiveSelector - Collective with host filter

**Internal Transfer** (2 stories)

- InternalTransferFromAccount - Source with archived support
- InternalTransferToAccount - Destination with filtering

**Expense & Payee** (3 stories)

- ExpensePayeeSelection - Invitable with profiles/vendors
- VendorSelection - Vendor with creation
- VendorVisibilityMultiSelect - Multi-select for visibility

**Virtual Cards** (2 stories)

- VirtualCardCollectiveSelection - Active collectives only
- VirtualCardAssigneeSelection - User assignee

**Host Application** (2 stories)

- ApplyToHostCollectiveSelection - Collective selection with creation
- ApplyToHostInviteAdmins - Admin invitation

**Orders & Contributions** (3 stories)

- GiftCardHostLimitation - Multi-select host limitation
- PendingOrderRecipient - Order recipient
- PendingOrderChildAccount - Child account with "None" option
- ContributeProfileSelection - Profile with incognito

**Team Management** (1 story)

- InviteMemberSelection - Member invitation with filtering

**Other Use Cases** (3 stories)

- HostOrganizationSelection - Host-only filtering
- OtherProfilesSelection - User's profiles
- MoveExpenseDestination - Expense move destination

## Key Features Demonstrated

### Data Source Patterns

✅ **Prefetched** - Static list (CollectivePicker)
✅ **Query** - Dynamic API search (CollectivePickerAsync)
✅ **Hybrid** - Default collectives + API search
✅ **Custom Options** - Static options alongside results

### Feature Combinations

✅ Single vs Multi-select
✅ Creatable (new accounts/users/vendors)
✅ Invitable (email invitations)
✅ Type filtering (USER, ORGANIZATION, COLLECTIVE, etc.)
✅ Host scoping (hostCollectiveIds)
✅ Result filtering (filterResults callback)
✅ Grouping by type
✅ Custom option positioning (TOP/BOTTOM)
✅ Archive inclusion

### Mock Data Provided

- Users and profiles
- Organizations
- Collectives, Funds, Events, Projects
- Vendors
- Host organizations
- Active/archived accounts

## Cross-Reference Documentation

All stories are based on actual usage patterns documented in:

- **COLLECTIVE_PICKER_USAGE.csv** - Usage matrix
- **COLLECTIVE_PICKER_USAGE.md** - Detailed patterns
- **COLLECTIVE_PICKER_CORE_PATTERNS.md** - Core conventions

## Running the Stories

```bash
npm run storybook
```

Then navigate to:

- `Components/CollectivePicker` - Basic stories
- `Components/CollectivePicker/Async` - Async stories and all use cases

## Technical Implementation

### Code Quality

- ✅ All ESLint errors fixed (0 errors, 14 acceptable warnings)
- ✅ Proper React component structure with hooks
- ✅ Correct Storybook imports (`@storybook/nextjs-vite`)
- ✅ TypeScript types properly declared
- ✅ Mock data representative of real usage
- ✅ Apollo Client MockedProvider configured in Storybook

### Apollo Client Setup

The `.storybook/preview.ts` has been updated to include Apollo Client's `MockedProvider`:

- Wraps all stories with a mocked Apollo Client context
- Prevents "Invariant Violation" errors from `useLazyQuery` hooks
- Stories display UI correctly without making actual API calls
- Stories with `defaultCollectives` show those immediately
- Stories without defaults may show loading/empty states (expected behavior)

### Story Organization

- Clear separation between basic and use-case stories
- Comprehensive JSDoc comments explaining each story
- Parameters with story descriptions
- Consistent naming conventions

## Usage Examples

### For Developers

When implementing a new CollectivePicker:

1. Find the relevant use-case story (e.g., "VendorSelection")
2. Copy the prop configuration
3. Adapt the mock data to your real data source

### For Designers

- View all variations in Storybook
- Test different states and configurations
- Understand interaction patterns

### For QA

- Use stories as test cases
- Verify behavior matches documentation
- Test edge cases (empty state, large datasets, etc.)

## Notes

- **API Mocking**: CollectivePickerAsync stories work in Storybook but actual API calls would need to be mocked for full functionality
- **Type Warnings**: The 14 TypeScript warnings about `any` types are acceptable for story files as they're examples
- **Extensibility**: Easy to add more stories by following the established patterns

## Next Steps

If you want to enhance the stories further:

1. Add MSW (Mock Service Worker) integration for realistic async behavior
2. Add interaction tests using Storybook's play function
3. Add accessibility tests using the a11y addon
4. Add visual regression tests

## Summary

✅ **43 comprehensive stories** covering all platform usage patterns
✅ **Organized and documented** with clear examples
✅ **Production-ready** with no linting errors
✅ **Cross-referenced** with existing documentation
✅ **Ready for development and testing**
