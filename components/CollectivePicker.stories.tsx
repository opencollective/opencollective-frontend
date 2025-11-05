/**
 * Storybook stories for CollectivePicker and CollectivePickerAsync components.
 *
 * ## Story Organization
 *
 * ### Basic CollectivePicker Stories (Components/CollectivePicker)
 * - Core functionality and prop variations
 * - Single/multi-select modes
 * - Grouping, filtering, creation options
 *
 * ### CollectivePickerAsync Stories (Components/CollectivePicker/Async)
 * - Basic async functionality
 * - Default collectives + API search patterns
 *
 * ### Real-World Use Case Stories
 * These stories mirror actual platform usage patterns documented in:
 * - COLLECTIVE_PICKER_USAGE.csv
 * - COLLECTIVE_PICKER_USAGE.md
 *
 * Each story demonstrates a specific component usage with:
 * - Accurate prop configurations
 * - Representative mock data
 * - Contextual documentation
 *
 * ## Note on Async Stories
 * CollectivePickerAsync stories use Apollo Client's MockedProvider. API queries
 * won't return actual data, so stories with `defaultCollectives` will display those,
 * while others may show loading or empty states. This is expected behavior for
 * component demonstration purposes.
 */
import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CollectiveType } from '../lib/constants/collectives';

import CollectivePicker from './CollectivePicker';
import CollectivePickerAsync from './CollectivePickerAsync';
import { Label } from './ui/Label';

const mockCollectives = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    slug: 'john-doe',
    type: 'USER',
    imageUrl: null,
  },
  {
    id: '2',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    slug: 'acme-corp',
    type: 'ORGANIZATION',
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Open Source Collective',
    email: 'info@opensource.com',
    slug: 'open-source-collective',
    type: 'COLLECTIVE',
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Community Fund',
    email: 'fund@community.org',
    slug: 'community-fund',
    type: 'FUND',
    imageUrl: null,
  },
  {
    id: '5',
    name: 'Annual Conference 2024',
    email: 'event@conference.com',
    slug: 'annual-conference-2024',
    type: 'EVENT',
    imageUrl: null,
  },
  {
    id: '6',
    name: 'Development Project',
    email: 'dev@project.com',
    slug: 'dev-project',
    type: 'PROJECT',
    imageUrl: null,
  },
  {
    id: '7',
    name: 'Marketing Vendor',
    email: 'vendor@marketing.com',
    slug: null,
    type: 'VENDOR',
    imageUrl: null,
  },
  {
    id: '8',
    name: 'Sarah Wilson',
    email: 'sarah@startup.io',
    slug: 'sarah-wilson',
    type: 'USER',
    imageUrl: null,
  },
  {
    id: '9',
    name: 'Tech Solutions Inc',
    email: 'contact@techsolutions.com',
    slug: 'tech-solutions',
    type: 'ORGANIZATION',
    imageUrl: null,
  },
  {
    id: '10',
    name: 'Developers Collective',
    email: 'hello@developers.com',
    slug: 'developers-collective',
    type: 'COLLECTIVE',
    imageUrl: null,
  },
  // Add more mock data for testing
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `generated-${i + 11}`,
    name: `User ${i + 11}`,
    email: `user${i + 11}@example.com`,
    slug: `user-${i + 11}`,
    type: 'USER' as const,
    imageUrl: null,
  })),
];

const meta: Meta<typeof CollectivePicker> = {
  title: 'Components/CollectivePicker',
  component: CollectivePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A specialized select component for picking collectives. Supports grouping by type, filtering, creation of new collectives, and inviting users.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    collectives: {
      control: false,
      description: 'Array of collective objects to display in the picker',
    },
    collective: {
      control: false,
      description: 'Currently selected collective or array of collectives for multi-select',
    },
    isMulti: {
      control: { type: 'boolean' },
      description: 'Enable multi-select mode',
    },
    isSearchable: {
      control: { type: 'boolean' },
      description: 'Enable search functionality',
    },
    creatable: {
      control: { type: 'boolean' },
      description: 'Show "Create new" option at the bottom of the list',
    },
    invitable: {
      control: { type: 'boolean' },
      description: 'Show "Invite new" option at the bottom of the list',
    },
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Disable the picker',
    },
    groupByType: {
      control: { type: 'boolean' },
      description: 'Group collectives by their type (USER, ORGANIZATION, COLLECTIVE, etc.)',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when no selection is made',
    },
    types: {
      control: { type: 'object' },
      description: 'Array of CollectiveType to filter which types are shown',
    },
    onChange: { control: false },
    onInputChange: { control: false },
    onInvite: { control: false },
    onCreateClick: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state
const PickerWrapper = (props: any) => {
  const [collective, setCollective] = useState(props.collective);

  return (
    <div className="w-96">
      <CollectivePicker
        {...props}
        collective={collective}
        onChange={(newValue: any) => {
          setCollective(newValue?.value);
        }}
        // onInputChange={(newValue: any) => console.log('Search changed:', newValue)}
        // onInvite={(value: any) => console.log('Invite clicked:', value)}
        // onCreateClick={(type: any) => console.log('Create clicked for type:', type)}
      />
    </div>
  );
};

export const Default: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: undefined,
    isMulti: false,
    placeholder: 'Select a collective...',
    isSearchable: true,
    groupByType: true,
  },
};

export const WithSelection: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: mockCollectives[0],
    placeholder: 'Select a collective...',
    groupByType: true,
  },
};

export const MultiSelect: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: [mockCollectives[0], mockCollectives[2]],
    isMulti: true,
    placeholder: 'Select collectives...',
    groupByType: true,
  },
};

export const WithoutGrouping: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: undefined,
    placeholder: 'Select a collective...',
    groupByType: false,
  },
};

export const WithCreateOption: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: undefined,
    placeholder: 'Select a collective...',
    creatable: true,
    groupByType: true,
  },
};

export const WithInviteOption: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: undefined,
    placeholder: 'Select a collective...',
    invitable: true,
    groupByType: true,
  },
};

export const WithCreateAndInvite: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: undefined,
    placeholder: 'Select a collective...',
    creatable: true,
    invitable: true,
    groupByType: true,
  },
};

export const FilteredByType: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    types: [CollectiveType.USER],
    placeholder: 'Select a user...',
    groupByType: true,
  },
};

export const OrganizationsOnly: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    types: [CollectiveType.ORGANIZATION],
    placeholder: 'Select an organization...',
    groupByType: true,
    creatable: true,
  },
};

export const CollectivesOnly: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    types: [CollectiveType.COLLECTIVE],
    placeholder: 'Select a collective...',
    groupByType: true,
  },
};

export const VendorsOnly: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    types: [CollectiveType.VENDOR],
    placeholder: 'Select a vendor...',
    groupByType: true,
    creatable: true,
  },
};

export const MultipleTypes: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    types: [CollectiveType.USER, CollectiveType.ORGANIZATION],
    placeholder: 'Select user or organization...',
    groupByType: true,
  },
};

export const Disabled: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: mockCollectives[0],
    placeholder: 'Select a collective...',
    isDisabled: true,
    groupByType: true,
  },
};

export const EmptyState: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: [],
    placeholder: 'No collectives available',
    creatable: true,
    invitable: true,
    groupByType: true,
  },
};

export const NotSearchable: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives.slice(0, 5),
    placeholder: 'Select a collective...',
    isSearchable: false,
    groupByType: true,
  },
};

export const LargeDataset: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: [
      ...mockCollectives,
      ...Array.from({ length: 100 }, (_, i) => ({
        id: `large-${i + 50}`,
        name: `Collective ${i + 50}`,
        email: `collective${i + 50}@example.com`,
        slug: `collective-${i + 50}`,
        type: ['USER', 'ORGANIZATION', 'COLLECTIVE', 'FUND'][i % 4] as any,
        imageUrl: null,
      })),
    ],
    placeholder: 'Select from large dataset...',
    groupByType: true,
  },
};

export const CustomWidth: Story = {
  render: args => (
    <div className="w-full" style={{ maxWidth: '600px' }}>
      <PickerWrapper {...args} />
    </div>
  ),
  args: {
    collectives: mockCollectives,
    collective: undefined,
    placeholder: 'Custom width picker...',
    groupByType: true,
    width: '100%',
  },
};

export const MinMaxWidth: Story = {
  render: args => (
    <div className="flex flex-col gap-4" style={{ width: '800px' }}>
      <div>
        <label className="mb-2 block text-sm font-medium">Min Width: 200px</label>
        <CollectivePicker {...args} minWidth="200px" placeholder="Min width 200px" collectives={mockCollectives} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Max Width: 300px</label>
        <CollectivePicker {...args} maxWidth="300px" placeholder="Max width 300px" collectives={mockCollectives} />
      </div>
    </div>
  ),
  args: {
    groupByType: true,
  },
};

export const WithCustomOptions: Story = {
  render: args => {
    const customOptions = [
      {
        label: 'Custom Option 1',
        value: { id: 'custom-1', name: 'Custom 1', type: 'CUSTOM' },
      },
      {
        label: 'Custom Option 2',
        value: { id: 'custom-2', name: 'Custom 2', type: 'CUSTOM' },
      },
    ];

    return <PickerWrapper {...args} customOptions={customOptions} />;
  },
  args: {
    collectives: mockCollectives.slice(0, 5),
    placeholder: 'With custom options...',
    groupByType: true,
  },
};

// ============================================================
// CollectivePickerAsync Stories
// ============================================================

// Mock data for async scenarios
const mockHostCollective = {
  id: 'host-1',
  legacyId: 1,
  name: 'Open Source Collective',
  slug: 'opensource',
  type: 'ORGANIZATION',
  imageUrl: 'https://images-staging.opencollective.com/opensource/499dca8/logo/256.png?height=256',
  isHost: true,
};

const mockVendors = [
  {
    id: 'vendor-1',
    name: 'Office Supplies Co',
    email: 'contact@officesupplies.com',
    slug: null,
    type: 'VENDOR',
    imageUrl: null,
  },
  {
    id: 'vendor-2',
    name: 'Catering Services',
    email: 'info@catering.com',
    slug: null,
    type: 'VENDOR',
    imageUrl: null,
  },
];

const mockActiveAccounts = [
  {
    id: 'account-1',
    name: 'Design Team Collective',
    slug: 'design-team',
    type: 'COLLECTIVE',
    imageUrl: null,
    isActive: true,
  },
  {
    id: 'account-2',
    name: 'Engineering Fund',
    slug: 'engineering-fund',
    type: 'FUND',
    imageUrl: null,
    isActive: true,
  },
  {
    id: 'account-3',
    name: 'Summer Conference 2024',
    slug: 'summer-conf-2024',
    type: 'EVENT',
    imageUrl: null,
    isActive: true,
  },
];

const mockUserProfiles = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    slug: 'alice-johnson',
    email: 'alice@example.com',
    type: 'USER',
    imageUrl: null,
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    slug: 'bob-smith',
    email: 'bob@example.com',
    type: 'USER',
    imageUrl: null,
  },
];

const mockCollectiveUsers = [
  ...mockUserProfiles,
  {
    id: 'user-3',
    name: 'Carol White',
    slug: 'carol-white',
    email: 'carol@example.com',
    type: 'USER',
    imageUrl: null,
  },
];

// Wrapper for async picker stories
const AsyncPickerWrapper = (props: any) => {
  const [collective, setCollective] = useState(props.collective);

  return (
    <div className="w-96">
      {props.label && <Label>{props.label}</Label>}
      <CollectivePickerAsync
        {...props}
        collective={collective}
        onChange={(newValue: any) => {
          setCollective(newValue?.value);
        }}
      />
    </div>
  );
};

type AsyncStory = StoryObj<typeof CollectivePickerAsync>;

// Basic Async Stories
export const AsyncDefault: AsyncStory = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search for collectives...',
    preload: true,
  },
};

export const AsyncWithTypes: AsyncStory = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    types: [CollectiveType.COLLECTIVE, CollectiveType.FUND],
    placeholder: 'Search for collectives or funds...',
    preload: true,
  },
};

export const AsyncWithDefaultCollectives: AsyncStory = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    defaultCollectives: mockActiveAccounts,
    placeholder: 'Search or select from active accounts...',
  },
};

// ============================================================
// Real-World Use Case Stories
// ============================================================

/**
 * Add Funds Modal - Source Selection
 * Uses: Query + Custom Options (vendors + host)
 * Types: USER, ORGANIZATION, VENDOR
 * Creatable: USER, VENDOR
 */
export const AddFundsSourcePicker: AsyncStory = {
  render: args => {
    const customOptions = [
      {
        label: 'Organizations',
        options: [
          {
            label: mockHostCollective.name,
            value: mockHostCollective,
          },
        ],
      },
      {
        label: 'Vendors',
        options: mockVendors.map(v => ({
          label: v.name,
          value: v,
        })),
      },
    ];

    return <AsyncPickerWrapper {...args} customOptions={customOptions} />;
  },
  args: {
    types: [CollectiveType.USER, CollectiveType.ORGANIZATION, CollectiveType.VENDOR],
    creatable: [CollectiveType.USER, CollectiveType.VENDOR],
    label: 'Source',
    placeholder: 'Search for Users, Organizations or Vendors',
    preload: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Add Funds Modal to select the source account with recommended vendors and host.',
      },
    },
  },
};

/**
 * Add Funds Modal - Recipient Selection (Static)
 * Uses: Prefetched (account + children)
 */
export const AddFundsRecipientPicker: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: [mockActiveAccounts[0], ...mockActiveAccounts.slice(1, 3)],
    placeholder: 'Select recipient account...',
    groupByType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Add Funds Modal to select recipient from parent account and its children.',
      },
    },
  },
};

/**
 * Add Funds Modal - Collective Selector
 * Uses: Query with hostCollectiveIds filter
 * Types: COLLECTIVE, PROJECT, EVENT, FUND
 */
export const AddFundsCollectiveSelector: AsyncStory = {
  render: args => {
    const customOptions = [
      {
        label: mockHostCollective.name,
        value: mockHostCollective,
      },
    ];

    return <AsyncPickerWrapper {...args} customOptions={customOptions} />;
  },
  args: {
    types: [CollectiveType.COLLECTIVE, CollectiveType.PROJECT, CollectiveType.EVENT, CollectiveType.FUND],
    hostCollectiveIds: [mockHostCollective.legacyId],
    placeholder: 'Select collective...',
    preload: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Add Funds Modal to select a collective hosted by a specific fiscal host.',
      },
    },
  },
};

/**
 * Internal Transfer Modal - From/To Account
 * Uses: Query + Default (activeAccounts)
 * Special: includeArchived=true, parentCollectiveIds filter
 */
export const InternalTransferFromAccount: AsyncStory = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    defaultCollectives: mockActiveAccounts,
    includeArchived: true,
    placeholder: 'From account...',
    preload: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Used in Internal Transfer Modal to select the source account. Shows active accounts immediately and allows searching for archived ones.',
      },
    },
  },
};

export const InternalTransferToAccount: AsyncStory = {
  render: args => {
    // In real usage, this would filter out the selected fromAccount
    const availableAccounts = mockActiveAccounts.slice(1);
    return <AsyncPickerWrapper {...args} defaultCollectives={availableAccounts} />;
  },
  args: {
    includeArchived: true,
    placeholder: 'To account...',
    preload: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Used in Internal Transfer Modal to select the destination account. Filters out the selected from account.',
      },
    },
  },
};

/**
 * Expense Payee Selection
 * Uses: Query + Custom (payoutProfiles + vendors)
 * Features: Invitable, Custom Options Position Bottom
 */
export const ExpensePayeeSelection: AsyncStory = {
  render: args => {
    const emptyCustomOptions = [
      {
        label: 'My Profiles',
        options: mockUserProfiles.map(p => ({
          label: p.name,
          value: p,
        })),
      },
      {
        label: 'Saved Vendors',
        options: mockVendors.map(v => ({
          label: v.name,
          value: v,
        })),
      },
    ];

    return <AsyncPickerWrapper {...args} emptyCustomOptions={emptyCustomOptions} />;
  },
  args: {
    invitable: true,
    placeholder: 'Who is getting paid?',
    customOptionsPosition: 'BOTTOM',
    preload: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Used in expense forms to select a payee. Shows user profiles and saved vendors, allows inviting new users.',
      },
    },
  },
};

/**
 * Vendor Selection
 * Uses: Query + Default (vendorsForAccount)
 * Types: VENDOR
 * Creatable: VENDOR (if admin)
 */
export const VendorSelection: AsyncStory = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    types: [CollectiveType.VENDOR],
    defaultCollectives: mockVendors,
    creatable: [CollectiveType.VENDOR],
    placeholder: 'Select or create vendor...',
    preload: false,
    useBeneficiaryForVendor: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used for vendor selection in expense forms. Shows existing vendors and allows creating new ones.',
      },
    },
  },
};

/**
 * Vendor Form - Visible to Accounts (Multi-select)
 * Uses: Query with hostCollectiveIds
 * Features: Multi-select, filterResults
 */
const VendorVisibilityWrapper = (props: any) => {
  const [collectives, setCollectives] = useState([]);
  return (
    <div className="w-96">
      <CollectivePickerAsync
        {...props}
        collective={collectives}
        onChange={(newValue: any) => {
          setCollectives(newValue ? newValue.map((v: any) => v.value) : []);
        }}
      />
    </div>
  );
};

export const VendorVisibilityMultiSelect: AsyncStory = {
  render: args => <VendorVisibilityWrapper {...args} />,
  args: {
    isMulti: true,
    hostCollectiveIds: [mockHostCollective.legacyId],
    placeholder: 'Select accounts with visibility...',
    preload: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Vendor Form to select which accounts can see this vendor. Multi-select mode.',
      },
    },
  },
};

/**
 * Virtual Card Assignment - Collective Selection
 * Uses: Query + Custom (host)
 * Features: hostCollectiveIds filter, filterResults for active only
 */
export const VirtualCardCollectiveSelection: AsyncStory = {
  render: args => {
    const customOptions = [
      {
        label: mockHostCollective.name,
        value: mockHostCollective,
      },
    ];

    return <AsyncPickerWrapper {...args} customOptions={customOptions} />;
  },
  args: {
    hostCollectiveIds: [mockHostCollective.legacyId],
    filterResults: (collectives: any[]) => collectives.filter(c => c.isActive !== false),
    placeholder: 'Assign to collective...',
    preload: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Virtual Card modals to assign a card to a collective. Filters to show only active collectives.',
      },
    },
  },
};

/**
 * Virtual Card Assignment - Assignee Selection (Static)
 * Uses: Prefetched (collectiveUsers)
 * Features: groupByType=false
 */
export const VirtualCardAssigneeSelection: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectiveUsers,
    groupByType: false,
    placeholder: 'Assign to user...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Virtual Card modals to select which team member receives the card.',
      },
    },
  },
};

/**
 * Apply to Host - Collective Selection (Static)
 * Uses: Prefetched (user's admin collectives)
 * Types: COLLECTIVE
 * Features: Creatable with custom render
 */
export const ApplyToHostCollectiveSelection: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockActiveAccounts.filter(c => c.type === 'COLLECTIVE'),
    types: [CollectiveType.COLLECTIVE],
    creatable: true,
    placeholder: 'Select your collective...',
    groupByType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Apply to Host modal to select which collective is applying. Can create new collective.',
      },
    },
  },
};

/**
 * Apply to Host - Invite Admins
 * Uses: Query
 * Types: USER
 * Features: Creatable for inviting team members
 */
export const ApplyToHostInviteAdmins: AsyncStory = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    types: [CollectiveType.USER],
    creatable: [CollectiveType.USER],
    placeholder: 'Invite admin by email...',
    preload: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Apply to Host modal to invite admins to the collective being created.',
      },
    },
  },
};

/**
 * Create Gift Cards - Limit to Hosts (Multi-select)
 * Uses: Prefetched (hosts)
 * Features: Multi-select, sortFunc bypassed, groupByType=false
 */
const GiftCardWrapper = (props: any) => {
  const [collectives, setCollectives] = useState([]);
  const hosts = mockCollectives.filter(c => c.type === 'ORGANIZATION' || c.type === 'COLLECTIVE').slice(0, 5);

  return (
    <div className="w-96">
      <CollectivePicker
        {...props}
        collectives={hosts}
        collective={collectives}
        onChange={(newValue: any) => {
          setCollectives(newValue ? newValue.map((v: any) => v.value) : []);
        }}
      />
    </div>
  );
};

export const GiftCardHostLimitation: Story = {
  render: args => <GiftCardWrapper {...args} />,
  args: {
    isMulti: true,
    groupByType: false,
    placeholder: 'Limit to specific hosts (optional)...',
    useCompactMode: false, // Would be true when 3+ selected
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Create Gift Cards form to optionally limit which fiscal hosts can redeem the cards.',
      },
    },
  },
};

/**
 * Create Pending Order - Recipient
 * Uses: Query with hostCollectiveIds
 * Types: COLLECTIVE, ORGANIZATION, FUND
 */
export const PendingOrderRecipient: AsyncStory = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    types: [CollectiveType.COLLECTIVE, CollectiveType.ORGANIZATION, CollectiveType.FUND],
    hostCollectiveIds: [mockHostCollective.legacyId],
    preload: true,
    placeholder: 'Select recipient...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Create Pending Order modal to select the order recipient from hosted collectives.',
      },
    },
  },
};

/**
 * Create Pending Order - Child Account (Static)
 * Uses: Prefetched (childrenAccounts)
 * Features: Custom "None" option
 */
export const PendingOrderChildAccount: Story = {
  render: args => {
    const customOptions = [
      {
        label: 'None',
        value: null,
      },
    ];

    return <PickerWrapper {...args} customOptions={customOptions} />;
  },
  args: {
    collectives: mockActiveAccounts.slice(1, 3),
    placeholder: 'Select child account (optional)...',
    groupByType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Create Pending Order modal to optionally select a child account of the recipient.',
      },
    },
  },
};

/**
 * Contribute Profile Picker
 * Uses: Prefetched (profiles)
 * Types: ORGANIZATION (creatable)
 * Features: Custom formatOptionLabel, incognito option
 */
export const ContributeProfileSelection: Story = {
  render: args => {
    const profilesWithIncognito = [
      {
        id: 'incognito',
        name: 'Contribute as Incognito',
        slug: 'incognito',
        type: 'USER',
        imageUrl: null,
      },
      ...mockUserProfiles,
    ];

    return <PickerWrapper {...args} collectives={profilesWithIncognito} />;
  },
  args: {
    creatable: [CollectiveType.ORGANIZATION],
    placeholder: 'Select profile...',
    groupByType: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Used when contributing to select which profile to use. Includes incognito option and can create organization.',
      },
    },
  },
};

/**
 * Invite Member Modal
 * Uses: Query
 * Types: USER
 * Features: Creatable, filterResults to exclude existing members
 */
export const InviteMemberSelection: AsyncStory = {
  render: args => {
    const existingMemberIds = new Set([mockUserProfiles[0].id]);

    return (
      <AsyncPickerWrapper
        {...args}
        filterResults={(collectives: any[]) => collectives.filter(c => !existingMemberIds.has(c.id))}
      />
    );
  },
  args: {
    types: [CollectiveType.USER],
    creatable: [CollectiveType.USER],
    placeholder: 'Search for user to invite...',
    preload: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Used in Invite Member modal to search for users. Filters out existing members and allows creating invitations.',
      },
    },
  },
};

/**
 * Who Is Paying Section - Host Organizations Only
 * Uses: Query
 * Types: Multiple types
 * Features: Filters to show only HOST organizations
 */
export const HostOrganizationSelection: AsyncStory = {
  render: args => (
    <AsyncPickerWrapper
      {...args}
      filterResults={(collectives: any[]) => collectives.filter(c => c.isHost || c.type === 'ORGANIZATION')}
    />
  ),
  args: {
    types: [
      CollectiveType.COLLECTIVE,
      CollectiveType.EVENT,
      CollectiveType.FUND,
      CollectiveType.ORGANIZATION,
      CollectiveType.PROJECT,
    ],
    placeholder: 'Select fiscal host...',
    preload: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Used in expense submission to select which fiscal host is paying. Filters to show only host organizations.',
      },
    },
  },
};

/**
 * Other Profiles Selection (Static)
 * Uses: Prefetched (myProfiles)
 */
export const OtherProfilesSelection: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockUserProfiles,
    placeholder: 'Select from your profiles...',
    groupByType: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Used to select from user's other administered profiles/accounts.",
      },
    },
  },
};

/**
 * Move Expense Destination (Static)
 * Uses: Prefetched (activeAccounts)
 */
export const MoveExpenseDestination: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockActiveAccounts,
    placeholder: 'Move expense to...',
    groupByType: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Edit Expense Dialog to move an expense between accounts.',
      },
    },
  },
};
