import React from 'react';
import { Delete, Pencil, Share, Trash } from 'lucide-react';

import DrawerHeader from '../../components/DrawerHeader';
import { Button } from '../../components/ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/Sheet';
import { CopyID } from '../../components/CopyId';
import { useModal } from '../../components/ModalContext';
import { Input } from '../../components/ui/Input';

const meta = {
  component: DrawerHeader,
  parameters: {
    docs: {
      description: {
        component: `
The \`DrawerHeader\` component is used to display the header section within a drawer. 
It includes an identifier, a name, a label, and a set of actions that can be taken.

## Usage
The \`DrawerHeader\` component is typically used inside a \`Sheet\` component to provide a context-specific header with actions for entities like transactions or other data types.

### Props
#### Entity
This is the name of the entity being displayed in the header, e.g. "Agreement", "Transaction", "Expense", etc.

#### Identifier
This is the unique identifier of the entity being displayed in the header, e.g. the ID of the agreement, the transaction ID, etc.

#### Label
This is the label/title of the entity being displayed in the header, which might be different things depending on the enitity e.g. "Coworking at Kolgruvan" for an Agreement, "$43.21 USD" for a Transaction, Avatar + "BackYourStack" for a Collective

## Example
This example demonstrates how to use \`DrawerHeader\` with a primary action to edit the entity.

\`\`\`jsx
<Sheet>
    <SheetTrigger asChild>
        <Button>Open drawer</Button>
    </SheetTrigger>
    <SheetContent>
        <DrawerHeader
            identifier={<CopyID value={account.id}>#{account.id}</CopyID>}
            entity="Agreement"
            label="Test Collective"
            actions={{
              primary: [
                {
                  key: 'edit',
                  label: 'Edit',
                  onClick: () => {},
                  Icon: Pencil,
                },
              ],
              secondary: [
                {
                  key: 'share',
                  label: 'Share',
                  onClick: () => {},
                  Icon: Share,
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  onClick: () => {},
                  Icon: Trash,
                },
              ],
            }}
          />
        {/* Drawer contents */}
    </SheetContent>
</Sheet>
\`\`\`
          `,
      },
    },
  },
};

export default meta;

const ExampleComponent: React.FC = () => {
  const account = {
    id: '1234',
  };
  const { showConfirmationModal } = useModal();
  const [isEditing, setEditing] = React.useState(false);
  const defaultActions = {
    primary: [
      {
        key: 'edit',
        label: 'Edit',
        onClick: () => setEditing(true),
        Icon: Pencil,
      },
    ],
    secondary: [
      {
        key: 'share',
        label: 'Share',
        onClick: () => {},
        Icon: Share,
      },
      {
        key: 'delete',
        label: 'Delete',
        onClick: () =>
          showConfirmationModal({
            title: 'Delete agreement?',
            description: 'This will permanently delete the agreement and all attachments and comments.',
            confirmLabel: 'Delete',
            variant: 'destructive',
            onConfirm: () => {},
          }),
        Icon: Trash,
      },
    ],
  };
  const editingActions = {
    primary: [
      {
        key: 'cancel',
        label: 'Cancel',
        variant: 'outline',
        onClick: () => {
          setEditing(false);
        },
      },
      {
        key: 'save',
        label: 'Save',
        variant: 'default',
        onClick: () => setEditing(false),
        // Icon: Check,
      },
    ],
  };
  const label = 'Coworking at Kolgruvan';
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open drawer</Button>
      </SheetTrigger>
      <SheetContent>
        <DrawerHeader
          identifier={<CopyID value={account.id}>#{account.id}</CopyID>}
          entity="Agreement"
          label={label}
          actions={isEditing ? editingActions : defaultActions}
        />
      </SheetContent>
    </Sheet>
  );
};
export const Example = {
  render: () => <ExampleComponent />,
};
