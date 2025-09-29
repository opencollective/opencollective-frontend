import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { useState } from 'react';
import { gql } from '@apollo/client';

import { CollectiveType } from '../lib/constants/collectives';

import CollectivePickerAsync from './AccountPickerAsync';

// Import the actual query used by AccountPickerAsync
const accountPickerSearchQuery = gql`
  query AccountPickerSearch(
    $term: String!
    $types: [AccountType]
    $limit: Int
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

// Mock GraphQL response
const mockSearchResults = [
  {
    id: '1',
    name: 'John Doe',
    slug: 'john-doe',
    type: 'INDIVIDUAL',
    currency: 'USD',
    imageUrl: null, // Use null instead of invalid URL
    location: null,
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
    imageUrl: null,
    location: {
      id: '1',
      address: '123 Business St',
      country: 'US',
    },
    isActive: true,
    isArchived: false,
    isHost: true,
  },
  {
    id: '3',
    name: 'Open Source Collective',
    slug: 'opensource',
    type: 'COLLECTIVE',
    currency: 'USD',
    imageUrl: null,
    location: null,
    isActive: true,
    isArchived: false,
    isHost: false,
  },
  {
    id: '4',
    name: 'Marketing Vendor',
    slug: null,
    type: 'VENDOR',
    currency: 'USD',
    imageUrl: null,
    location: null,
    isActive: true,
    isArchived: false,
    isHost: false,
    hasPayoutMethod: true,
    visibleToAccounts: [],
  },
];

// Create comprehensive mocks for different scenarios
const mocks = [
  // Default preload query (empty term with default props)
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: undefined,
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: mockSearchResults.length,
          nodes: mockSearchResults,
        },
      },
    },
  },
  // Search with term
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: 'john',
        types: undefined,
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[0]],
        },
      },
    },
  },
  // Users only (using INDIVIDUAL for GraphQL v2)
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: ['INDIVIDUAL'],
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[0]], // Only John Doe (INDIVIDUAL)
        },
      },
    },
  },
  // Users only (legacy USER support)
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: ['USER'],
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[0]], // Only John Doe (USER)
        },
      },
    },
  },
  // Organizations only
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: ['ORGANIZATION'],
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: 1,
          nodes: [mockSearchResults[1]], // Only Acme Corporation
        },
      },
    },
  },
  // Multiple types (INDIVIDUAL, ORGANIZATION)
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: ['INDIVIDUAL', 'ORGANIZATION'],
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: 2,
          nodes: [mockSearchResults[0], mockSearchResults[1]],
        },
      },
    },
  },
  // Multiple types (USER, ORGANIZATION) - legacy support
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: ['USER', 'ORGANIZATION'],
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: 2,
          nodes: [mockSearchResults[0], mockSearchResults[1]],
        },
      },
    },
  },
  // Include archived
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: undefined,
        limit: 20,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: true,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: mockSearchResults.length,
          nodes: mockSearchResults,
        },
      },
    },
  },
  // Limited results (5)
  {
    request: {
      query: accountPickerSearchQuery,
      variables: {
        term: '',
        types: undefined,
        limit: 5,
        host: undefined,
        parent: undefined,
        skipGuests: true,
        includeArchived: false,
        includeVendorsForHost: undefined,
      },
    },
    result: {
      data: {
        accounts: {
          totalCount: mockSearchResults.length,
          nodes: mockSearchResults.slice(0, 5),
        },
      },
    },
  },
];

const meta: Meta<typeof CollectivePickerAsync> = {
  title: 'Components/AccountPickerAsync',
  component: CollectivePickerAsync,
  decorators: [
    Story => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An async account picker that fetches data from GraphQL API based on user search.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    types: {
      control: { type: 'object' },
      description: 'Array of account types to filter',
    },
    limit: {
      control: { type: 'number' },
      description: 'Maximum number of results to fetch',
    },
    preload: {
      control: { type: 'boolean' },
      description: 'Preload results on mount',
    },
    invitable: {
      control: { type: 'boolean' },
      description: 'Show invite user option',
    },
    skipGuests: {
      control: { type: 'boolean' },
      description: 'Skip guest accounts in results',
    },
    includeArchived: {
      control: { type: 'boolean' },
      description: 'Include archived accounts',
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Show loading state',
    },
    onChange: { control: false },
    onInputChange: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state
const AsyncPickerWrapper = (props: any) => {
  const [collective, setCollective] = useState(props.collective || null);

  return (
    <div className="w-80">
      <CollectivePickerAsync
        inputId="storybook-async-picker"
        {...props}
        collective={collective}
        onChange={(newValue: any) => {
          setCollective(newValue);
          console.log('Account changed:', newValue);
        }}
        onInputChange={(newValue: any) => console.log('Search changed:', newValue)}
      />
    </div>
  );
};

export const Default: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search accounts...',
  },
};

export const WithPreload: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search accounts...',
    preload: true,
  },
};

export const UsersOnly: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    types: [CollectiveType.USER],
    placeholder: 'Search users...',
    preload: true,
  },
};

export const OrganizationsOnly: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    types: [CollectiveType.ORGANIZATION],
    placeholder: 'Search organizations...',
    preload: true,
  },
};

export const WithInvite: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search accounts...',
    invitable: true,
    preload: true,
  },
};

export const MultipleTypes: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    types: [CollectiveType.USER, CollectiveType.ORGANIZATION],
    placeholder: 'Search users or organizations...',
    preload: true,
  },
};

export const WithSelection: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    collective: {
      id: '1',
      name: 'John Doe',
      slug: 'john-doe',
      type: 'USER',
      imageUrl: null, // Use null instead of invalid URL
    },
    placeholder: 'Search accounts...',
    preload: true,
  },
};

export const IncludeArchived: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search accounts (including archived)...',
    includeArchived: true,
    preload: true,
  },
};

export const LimitedResults: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search accounts (max 5 results)...',
    limit: 5,
    preload: true,
  },
};

export const LoadingState: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search accounts...',
    isLoading: true,
  },
};

export const WithDefaultCollectives: Story = {
  render: args => <AsyncPickerWrapper {...args} />,
  args: {
    placeholder: 'Search accounts...',
    defaultCollectives: [
      {
        id: 'default-1',
        name: 'Default Account',
        slug: 'default-account',
        type: 'USER',
        imageUrl: null,
      },
      {
        id: 'default-2',
        name: 'Favorite Organization',
        slug: 'favorite-org',
        type: 'ORGANIZATION',
        imageUrl: null,
      },
    ],
  },
};
