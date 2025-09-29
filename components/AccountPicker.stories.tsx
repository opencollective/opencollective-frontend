import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { CollectiveType } from '../lib/constants/collectives';

import CollectivePicker from './AccountPicker';

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

const meta: Meta<typeof CollectivePicker> = {
  title: 'Components/AccountPicker',
  component: CollectivePicker,
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
      <CollectivePicker
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
