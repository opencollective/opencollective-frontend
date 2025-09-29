import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { AccountPicker as AccountPickerPrototype } from './AccountPickerPrototype';

// Import the Account type from the same file
type Account = {
  id: string;
  name: string;
  email?: string;
  type: 'personal' | 'business' | 'organization' | 'vendor';
  avatar?: string | null;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  isHost?: boolean;
  balance?: number;
};

const mockAccounts = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    type: 'personal' as const,
    avatar: null, // Use null instead of invalid URL
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Acme Corp',
    email: 'team@acme.com',
    type: 'business' as const,
    role: 'Admin',
    status: 'active' as const,
  },
  {
    id: '3',
    name: 'Design Team',
    email: 'design@company.com',
    type: 'team' as const,
    role: 'Member',
    status: 'active' as const,
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah@startup.io',
    type: 'personal' as const,
    status: 'pending' as const,
  },
  {
    id: '5',
    name: 'Marketing Team',
    email: 'marketing@company.com',
    type: 'team' as const,
    role: 'Member',
    status: 'active' as const,
  },
  {
    id: '6',
    name: 'Tech Solutions Inc',
    email: 'contact@techsolutions.com',
    type: 'business' as const,
    role: 'Owner',
    status: 'active' as const,
  },
  {
    id: '7',
    name: 'Alice Johnson',
    email: 'alice@freelance.com',
    type: 'personal' as const,
    status: 'active' as const,
  },
  {
    id: '8',
    name: 'Development Team',
    email: 'dev@company.com',
    type: 'team' as const,
    role: 'Lead',
    status: 'active' as const,
  },
  {
    id: '9',
    name: 'Global Enterprises',
    email: 'admin@global.com',
    type: 'business' as const,
    role: 'Admin',
    status: 'active' as const,
  },
  {
    id: '10',
    name: 'Bob Smith',
    email: 'bob@contractor.com',
    type: 'personal' as const,
    status: 'invited' as const,
  },
  // Add more accounts to test infinite scroll
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `generated-${i + 11}`,
    name: `User ${i + 11}`,
    email: `user${i + 11}@example.com`,
    type: 'personal' as const,
    status: 'active' as const,
  })),
];

const meta: Meta<typeof AccountPickerPrototype> = {
  title: 'Components/AccountPickerPrototype',
  component: AccountPickerPrototype,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A prototype account picker component showcasing modern UI patterns and interactions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selectedAccount: {
      control: false,
      description: 'Currently selected account (single select mode)',
    },
    selectedAccounts: {
      control: false,
      description: 'Currently selected accounts (multi-select mode)',
    },
    multiSelect: {
      control: { type: 'boolean' },
      description: 'Enable multi-select mode',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when no selection',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    onAccountSelect: { control: false },
    onAccountsSelect: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle state
const PrototypeWrapper = (props: any) => {
  const [selectedAccount, setSelectedAccount] = useState(props.selectedAccount || undefined);
  const [selectedAccounts, setSelectedAccounts] = useState(props.selectedAccounts || []);

  return (
    <div className="w-80">
      <AccountPickerPrototype
        {...props}
        selectedAccount={props.multiSelect ? undefined : selectedAccount}
        selectedAccounts={props.multiSelect ? selectedAccounts : undefined}
        onAccountSelect={
          props.multiSelect
            ? undefined
            : (account: Account) => {
                setSelectedAccount(account);
                console.log('Account selected:', account);
              }
        }
        onAccountsSelect={
          props.multiSelect
            ? (accounts: Account[]) => {
                setSelectedAccounts(accounts);
                console.log('Accounts selected:', accounts);
              }
            : undefined
        }
      />
    </div>
  );
};

export const Default: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    placeholder: 'Select account...',
    multiSelect: false,
  },
};

export const WithSelection: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccount: mockAccounts[0],
    placeholder: 'Select account...',
    multiSelect: false,
  },
};

export const MultiSelect: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccounts: [mockAccounts[0], mockAccounts[1]],
    placeholder: 'Select accounts...',
    multiSelect: true,
  },
};

export const MultiSelectEmpty: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccounts: [],
    placeholder: 'Select multiple accounts...',
    multiSelect: true,
  },
};

export const MultiSelectMany: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccounts: [mockAccounts[0], mockAccounts[1], mockAccounts[2], mockAccounts[3], mockAccounts[4]],
    placeholder: 'Select accounts...',
    multiSelect: true,
  },
};

export const SingleSelectWithAvatar: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccount: mockAccounts[0], // John Doe with avatar
    placeholder: 'Select account...',
    multiSelect: false,
  },
};

export const WithPendingAccount: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccount: mockAccounts[3], // Sarah Wilson - pending
    placeholder: 'Select account...',
    multiSelect: false,
  },
};

export const WithInvitedAccount: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccount: mockAccounts[9], // Bob Smith - invited
    placeholder: 'Select account...',
    multiSelect: false,
  },
};

export const BusinessAccount: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccount: mockAccounts[1], // Acme Corp
    placeholder: 'Select account...',
    multiSelect: false,
  },
};

export const TeamAccount: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    selectedAccount: mockAccounts[2], // Design Team
    placeholder: 'Select account...',
    multiSelect: false,
  },
};

export const CustomPlaceholder: Story = {
  render: args => <PrototypeWrapper {...args} />,
  args: {
    placeholder: 'Choose your account...',
    multiSelect: false,
  },
};

export const CustomWidth: Story = {
  render: args => (
    <div className="w-96">
      <PrototypeWrapper {...args} />
    </div>
  ),
  args: {
    placeholder: 'Select account (custom width)...',
    multiSelect: false,
    className: 'w-full',
  },
};

export const InteractiveDemo: Story = {
  render: args => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Single Select</h3>
        <div className="w-80">
          <PrototypeWrapper {...args} multiSelect={false} placeholder="Single select..." />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-lg font-semibold">Multi Select</h3>
        <div className="w-80">
          <PrototypeWrapper {...args} multiSelect={true} placeholder="Multi select..." />
        </div>
      </div>
    </div>
  ),
  args: {},
};
