import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { CollectiveType } from '../lib/constants/collectives';

import CollectivePicker from './CollectivePicker';

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
          console.log('Collective changed:', newValue);
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
