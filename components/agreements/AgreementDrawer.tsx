import React from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import type { Agreement as GraphQLAgreement } from '../../lib/graphql/types/v2/graphql';

import { Drawer } from '../Drawer';
import DrawerHeader from '../DrawerHeader';
import FilesViewerModal from '../FilesViewerModal';

import AgreementDetails from './AgreementDetails';
import AgreementForm from './AgreementForm';

type AgreementDrawerProps = {
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
  onCreate: (GraphQLAgreement) => void;
  onEdit: (GraphQLAgreement) => void;
  onCancelEdit?: () => void;
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
  onCancelEdit,
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

  const dropdownTriggerRef = React.useRef<HTMLButtonElement>(null);
  const isFormMode = isEditing || !agreement;

  const actions = React.useMemo(() => {
    if (!getActions || !agreement || isEditing) {
      return undefined;
    }

    const baseActions = getActions(agreement);
    return {
      ...baseActions,
      primary: baseActions.primary.map(action =>
        action.key === 'edit' ? { ...action, onClick: () => setEditing(true) } : action,
      ),
    };
  }, [getActions, agreement, isEditing]);

  const cancelEdit = React.useCallback(() => {
    setEditing(false);
    onCancelEdit?.();
  }, [onCancelEdit]);

  return (
    <React.Fragment>
      <Drawer open={open} onClose={closeDrawer} showActionsContainer={isFormMode} data-cy="agreement-drawer">
        {agreement && (
          <div className="-mx-4 -mt-6 mb-8 sm:-mx-6">
            <DrawerHeader
              actions={actions}
              entityName={<FormattedMessage defaultMessage="Agreement" id="J3yqC3" />}
              entityIdentifier={agreement.publicId}
              entityLabel={agreement.title}
              dropdownTriggerRef={dropdownTriggerRef}
            />
          </div>
        )}

        {isFormMode ? (
          <AgreementForm
            hostLegacyId={hostLegacyId}
            agreement={agreement}
            onCreate={onCreate}
            onCancel={() => (isEditing ? cancelEdit() : closeDrawer())}
            openFileViewer={() => setFilesViewerOpen(true)}
            onEdit={agreement => {
              onEdit?.(agreement);
            }}
          />
        ) : (
          <AgreementDetails agreement={agreement} openFileViewer={() => setFilesViewerOpen(true)} />
        )}
      </Drawer>

      {filesViewerOpen &&
        agreement?.attachment &&
        createPortal(
          <FilesViewerModal
            files={[agreement.attachment]}
            openFileUrl={agreement.attachment.url}
            onClose={() => setFilesViewerOpen(false)}
            parentTitle={`${agreement.account.name} / ${agreement.title}`}
            allowOutsideInteraction
          />,
          document.body,
        )}
    </React.Fragment>
  );
}
