import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';

import { CollectiveType } from '../lib/constants/collectives';

import AccountPicker, { DefaultCollectiveLabel } from './AccountPicker';
import AccountPickerAsync from './AccountPickerAsync';
import { Label } from './ui/Label';

const mockCollectives = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    slug: 'john-doe',
    type: 'USER',
    imageUrl: null, // Use null instead of invalid URL
    status: 'active',
  },
  {
    id: '2',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    slug: 'acme-corp',
    type: 'ORGANIZATION',
    imageUrl: null,
    status: 'active',
    role: 'Admin',
  },
  {
    id: '3',
    name: 'Design Team',
    email: 'design@company.com',
    slug: 'design-team',
    type: 'COLLECTIVE',
    imageUrl: null,
    status: 'active',
    role: 'Member',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@startup.io',
    slug: 'sarah-wilson',
    type: 'USER',
    imageUrl: null,
    status: 'pending',
  },
  {
    id: '5',
    name: 'Tech Solutions Inc',
    email: 'contact@techsolutions.com',
    slug: 'tech-solutions',
    type: 'ORGANIZATION',
    imageUrl: null,
    status: 'active',
    role: 'Owner',
  },
  {
    id: '6',
    name: 'Marketing Vendor',
    email: 'vendor@marketing.com',
    slug: null,
    type: 'VENDOR',
    imageUrl: null,
    status: 'invited',
  },
  // Add more mock data for testing
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `generated-${i + 7}`,
    name: `User ${i + 7}`,
    email: `user${i + 7}@example.com`,
    slug: `user-${i + 7}`,
    type: 'USER' as const,
    imageUrl: null,
    status: 'active' as const,
  })),
];

const meta: Meta<typeof AccountPicker> = {
  title: 'Components/AccountPicker',
  component: AccountPicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modern account picker component with search, multi-select, and create/invite functionality.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    collectives: {
      control: false,
      description: 'Array of collective objects to display',
    },
    collective: {
      control: false,
      description: 'Selected collective(s) - single object or array for multi-select',
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
      description: 'Show create new account option',
    },
    invitable: {
      control: { type: 'boolean' },
      description: 'Show invite user option',
    },
    isDisabled: {
      control: { type: 'boolean' },
      description: 'Disable the picker',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when no selection',
    },
    types: {
      control: { type: 'object' },
      description: 'Array of collective types to filter',
    },
    onChange: { control: false },
    onInputChange: { control: false },
    onInvite: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state
const PickerWrapper = (props: any) => {
  const [collective, setCollective] = useState(props.collective);

  return (
    <div className="w-80">
      <AccountPicker
        {...props}
        collective={collective}
        onChange={(newValue: any) => {
          setCollective(newValue);
          console.log('Account changed:', newValue);
        }}
        onInputChange={(newValue: any) => console.log('Search changed:', newValue)}
        onInvite={(value: any) => console.log('Invite clicked:', value)}
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
    placeholder: 'Select account...',
    isSearchable: true,
  },
};

export const WithSelection: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: mockCollectives[0],
    isMulti: false,
    placeholder: 'Select account...',
    isSearchable: true,
  },
};

export const MultiSelect: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: [mockCollectives[0], mockCollectives[1]],
    isMulti: true,
    placeholder: 'Select accounts...',
    isSearchable: true,
  },
};

export const WithCreateAndInvite: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: undefined,
    isMulti: false,
    placeholder: 'Select account...',
    isSearchable: true,
    creatable: true,
    invitable: true,
  },
};

export const FilteredByType: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    types: [CollectiveType.USER],
    placeholder: 'Select user...',
    isSearchable: true,
  },
};

export const OrganizationsOnly: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    types: [CollectiveType.ORGANIZATION],
    placeholder: 'Select organization...',
    isSearchable: true,
    creatable: true,
  },
};

export const Disabled: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: mockCollectives,
    collective: mockCollectives[0],
    placeholder: 'Select account...',
    isDisabled: true,
  },
};

export const EmptyState: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: [],
    placeholder: 'No accounts available',
    isSearchable: true,
    creatable: true,
    invitable: true,
  },
};

export const LargeDataset: Story = {
  render: args => <PickerWrapper {...args} />,
  args: {
    collectives: [
      ...mockCollectives,
      ...Array.from({ length: 100 }, (_, i) => ({
        id: `large-${i + 50}`,
        name: `Account ${i + 50}`,
        email: `account${i + 50}@example.com`,
        slug: `account-${i + 50}`,
        type: ['USER', 'ORGANIZATION', 'COLLECTIVE'][i % 3] as any,
        imageUrl: null,
        status: 'active' as const,
      })),
    ],
    placeholder: 'Select from large dataset...',
    isSearchable: true,
  },
};

export const CustomWidth: Story = {
  render: args => (
    <div className="w-96">
      <PickerWrapper {...args} />
    </div>
  ),
  args: {
    collectives: mockCollectives,
    collective: undefined,
    isMulti: false,
    placeholder: 'Custom width picker...',
    isSearchable: true,
    width: '100%',
  },
};

// ============================================================
// AccountPickerAsync Stories
// ============================================================

// Mock data for async scenarios
const mockHostCollective = {
  id: 'host-1',
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
    slug: 'office-supplies-co',
    type: 'VENDOR',
    imageUrl: 'https://images-staging.opencollective.com/11004-cool-vendor-df225f15/logo/64.png',
  },
  {
    id: 'vendor-2',
    name: 'Catering Services',
    slug: 'catering-services',
    type: 'VENDOR',
    imageUrl: 'https://images-staging.opencollective.com/11004-cool-vendor-df225f15/logo/64.png',
  },
];

// Mock search results for AccountPickerAsync
const mockSearchResults = [
  {
    id: '1',
    name: 'John Doe',
    slug: 'john-doe',
    type: 'USER',
    currency: 'USD',
    location: null,
    imageUrl: null,
    isActive: true,
    isArchived: false,
    isHost: false,
    hasTwoFactorAuth: false,
  },
  {
    id: '2',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    type: 'ORGANIZATION',
    currency: 'USD',
    location: null,
    imageUrl: null,
    isActive: true,
    isArchived: false,
    isHost: false,
  },
  {
    id: '8',
    name: 'Sarah Wilson',
    slug: 'sarah-wilson',
    type: 'USER',
    currency: 'USD',
    location: null,
    imageUrl: null,
    isActive: true,
    isArchived: false,
    isHost: false,
    hasTwoFactorAuth: true,
  },
  {
    id: '9',
    name: 'Tech Solutions Inc',
    slug: 'tech-solutions',
    type: 'ORGANIZATION',
    currency: 'USD',
    location: null,
    imageUrl: null,
    isActive: true,
    isArchived: false,
    isHost: false,
  },
  {
    id: 'vendor-3',
    name: 'Marketing Vendor',
    slug: '11004-marketing-vendor',
    type: 'VENDOR',
    currency: 'USD',
    location: null,
    imageUrl: null,
    isActive: true,
    isArchived: false,
    isHost: false,
    hasPayoutMethod: true,
    visibleToAccounts: [],
  },
];

// GraphQL query used by AccountPickerAsync
const accountPickerSearchQuery = gql`
  query AccountPickerSearch(
    $term: String!
    $types: [AccountType]
    $limit: Int
    $offset: Int
    $host: [AccountReferenceInput]
    $parent: [AccountReferenceInput]
    $skipGuests: Boolean
    $includeArchived: Boolean
    $includeVendorsForHost: AccountReferenceInput
  ) {
    accounts(
      searchTerm: $term
      type: $types
      limit: $limit
      offset: $offset
      host: $host
      parent: $parent
      skipGuests: $skipGuests
      includeArchived: $includeArchived
      includeVendorsForHost: $includeVendorsForHost
    ) {
      totalCount
      nodes {
        id
        type
        slug
        name
        currency
        location {
          id
          address
          country
        }
        imageUrl(height: 64)
        isActive
        isArchived
        isHost
        ... on Vendor {
          hasPayoutMethod
          visibleToAccounts {
            id
            slug
            name
          }
        }
        ... on Individual {
          hasTwoFactorAuth
        }
      }
    }
  }
`;

// Create comprehensive Apollo mocks for different query scenarios
// Note: 800ms delay added to make loading state visible in Storybook
const apolloMocks = [
  // Default empty search (preload or initial state)
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        limit: 20,
        offset: 0,
        skipGuests: true,
        includeArchived: false,
      },
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: mockSearchResults.length,
          nodes: mockSearchResults,
        },
      },
    },
  },
  // Search for USER, ORGANIZATION, VENDOR types (AddFundsSourcePicker)
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: ['USER', 'ORGANIZATION', 'VENDOR'],
        limit: 20,
        offset: 0,
        skipGuests: true,
        includeArchived: false,
      },
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: mockSearchResults.length,
          nodes: mockSearchResults,
        },
      },
    },
  },
  // Search with term for USER, ORGANIZATION, VENDOR types
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: 'sarah',
        types: ['USER', 'ORGANIZATION', 'VENDOR'],
        limit: 20,
        offset: 0,
        skipGuests: true,
        includeArchived: false,
      },
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[2]], // Sarah Wilson
        },
      },
    },
  },
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: 'john',
        types: ['USER', 'ORGANIZATION', 'VENDOR'],
        limit: 20,
        offset: 0,
        skipGuests: true,
        includeArchived: false,
      },
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[0]], // John Doe
        },
      },
    },
  },
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: 'acme',
        types: ['USER', 'ORGANIZATION', 'VENDOR'],
        limit: 20,
        offset: 0,
        skipGuests: true,
        includeArchived: false,
      },
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[1]], // Acme Corporation
        },
      },
    },
  },
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: 'tech',
        types: ['USER', 'ORGANIZATION', 'VENDOR'],
        limit: 20,
        offset: 0,
        skipGuests: true,
        includeArchived: false,
      },
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[3]], // Tech Solutions Inc
        },
      },
    },
  },
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: 'vendor',
        types: ['USER', 'ORGANIZATION', 'VENDOR'],
        limit: 20,
        offset: 0,
        skipGuests: true,
        includeArchived: false,
      },
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[4]], // Marketing Vendor
        },
      },
    },
  },
  // Catch-all for other variations (returns all results)
  {
    request: {
      query: accountPickerSearchQuery,
    },
    delay: 800,
    result: {
      data: {
        accounts: {
          totalCount: mockSearchResults.length,
          nodes: mockSearchResults,
        },
      },
    },
  },
];

// Wrapper for async picker stories with Apollo mocks
const AsyncPickerWrapper = (props: any) => {
  const [collective, setCollective] = useState(props.collective);

  return (
    <MockedProvider mocks={apolloMocks} addTypename={false}>
      <div className="w-80">
        {props.label && <Label>{props.label}</Label>}
        <AccountPickerAsync
          {...props}
          collective={collective}
          onChange={(newValue: any) => {
            console.log({ newValue });
            setCollective(newValue);
            console.log('Account changed:', newValue);
          }}
        />
      </div>
    </MockedProvider>
  );
};

type AsyncStory = StoryObj<typeof AccountPickerAsync>;

// Pre-render custom options outside of the render function to avoid infinite re-renders
const addFundsCustomOptions = [
  {
    label: DefaultCollectiveLabel({ value: mockHostCollective }, {}),
    value: mockHostCollective,
  },
  ...mockVendors.map(v => ({
    label: DefaultCollectiveLabel({ value: v }, {}),
    value: v,
  })),
];

/**
 * Add Funds Modal - Source Selection
 * Uses: Query + Custom Options (vendors + host)
 * Types: INDIVIDUAL, ORGANIZATION, VENDOR
 * Creatable: INDIVIDUAL, VENDOR
 */
export const AddFundsSourcePicker: AsyncStory = {
  render: args => {
    return <AsyncPickerWrapper {...args} customOptions={addFundsCustomOptions} />;
  },
  args: {
    types: [CollectiveType.USER, CollectiveType.ORGANIZATION, CollectiveType.VENDOR],
    creatable: [CollectiveType.USER, CollectiveType.VENDOR],
    label: 'Source',
    placeholder: 'Search for Users, Organizations or Vendors',
    preload: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Used in Add Funds Modal to select the source account with recommended vendors and host.',
      },
    },
  },
};
