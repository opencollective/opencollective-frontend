import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import type { Agreement as GraphQLAgreement } from '../../lib/graphql/types/v2/graphql';

import DrawerHeader from '../DrawerHeader';
import FilesViewerModal from '../FilesViewerModal';
import { Sheet, SheetBody, SheetContent } from '../ui/Sheet';

import AgreementDetails from './AgreementDetails';
import AgreementForm from './AgreementForm';

type AgreementDrawerProps = {
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
  onCreate: (GraphQLAgreement) => void;
  onEdit: (GraphQLAgreement) => void;
  onDelete: (GraphQLAgreement) => void;
  agreement?: GraphQLAgreement;
  hostLegacyId: number;
  isEditing?: boolean;
  getActions?: GetActions<GraphQLAgreement>;
};

export default function AgreementDrawer({
  open,
  onClose,
  onCreate,
  onEdit,
  agreement,
  hostLegacyId,
  isEditing: initialIsEditing = false,
  getActions,
}: AgreementDrawerProps) {
  const [isEditing, setEditing] = React.useState<boolean>(initialIsEditing);
  const [filesViewerOpen, setFilesViewerOpen] = React.useState<boolean>(false);

  // Reset editing state when drawer opens/closes or agreement changes
  React.useEffect(() => {
    if (open) {
      setEditing(initialIsEditing);
    }
  }, [open, initialIsEditing, agreement]);

  const closeDrawer = React.useCallback(() => {
    setEditing(false);
    setFilesViewerOpen(false);
    onClose();
  }, [onClose]);

  const actions = getActions && agreement && !isEditing ? getActions(agreement) : undefined;
  const dropdownTriggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Sheet open={open} onOpenChange={open => !open && closeDrawer()}>
      <SheetContent data-cy="agreement-drawer">
        {agreement && (
          <DrawerHeader
            actions={actions}
            entityName={<FormattedMessage defaultMessage="Agreement" id="J3yqC3" />}
            entityIdentifier={`#${agreement.id}`}
            entityLabel={agreement.title}
            dropdownTriggerRef={dropdownTriggerRef}
          />
        )}

        <SheetBody>
          {isEditing || !agreement ? (
            <AgreementForm
              hostLegacyId={hostLegacyId}
              agreement={agreement}
              onCreate={onCreate}
              onCancel={() => (isEditing ? setEditing(false) : closeDrawer())}
              openFileViewer={() => setFilesViewerOpen(true)}
              onEdit={agreement => {
                onEdit?.(agreement);
              }}
            />
          ) : (
            <AgreementDetails agreement={agreement} openFileViewer={() => setFilesViewerOpen(true)} />
          )}
        </SheetBody>
      </SheetContent>

      {filesViewerOpen && (
        <FilesViewerModal
          files={[agreement.attachment]}
          openFileUrl={agreement.attachment.url}
          onClose={() => setFilesViewerOpen(false)}
          parentTitle={`${agreement.account.name} / ${agreement.title}`}
          allowOutsideInteraction
        />
      )}
    </Sheet>
  );
}
