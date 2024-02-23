import React from 'react';

import type { Agreement as GraphQLAgreement } from '../../lib/graphql/types/v2/graphql';

import { Drawer } from '../Drawer';
import FilesViewerModal from '../FilesViewerModal';

import Agreement from './Agreement';
import AgreementForm from './AgreementForm';
import { AgreementWithActions } from './AgreementWithActions';

type AgreementDrawerProps = {
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
  onCreate: (GraphQLAgreement) => void;
  onEdit: (GraphQLAgreement) => void;
  onDelete: (GraphQLAgreement) => void;
  agreement?: GraphQLAgreement;
  hostLegacyId: number;
};

export default function AgreementDrawer({
  open,
  onClose,
  onCreate,
  onEdit,
  onDelete,
  canEdit,
  agreement,
  hostLegacyId,
}: AgreementDrawerProps) {
  const [isEditing, setEditing] = React.useState<boolean>(false);
  const [filesViewerOpen, setFilesViewerOpen] = React.useState<boolean>(false);
  const closeDrawer = React.useCallback(() => {
    setEditing(false);
    setFilesViewerOpen(false);
    onClose();
  }, [onClose]);

  return (
    <Drawer
      open={open}
      onClose={closeDrawer}
      showCloseButton
      showActionsContainer={canEdit || isEditing || !agreement}
      data-cy="agreement-drawer"
    >
      {/* <DrawerHeader /> */}
      {isEditing || !agreement ? (
        <AgreementForm
          hostLegacyId={hostLegacyId}
          agreement={agreement}
          onCreate={onCreate}
          onCancel={() => (isEditing ? setEditing(false) : closeDrawer())}
          openFileViewer={() => setFilesViewerOpen(true)}
          onEdit={agreement => {
            onEdit?.(agreement);
            closeDrawer();
          }}
        />
      ) : canEdit ? (
        <AgreementWithActions
          agreement={agreement}
          onEdit={() => setEditing(true)}
          onDelete={onDelete}
          openFileViewer={() => setFilesViewerOpen(true)}
        />
      ) : (
        <Agreement agreement={agreement} openFileViewer={() => setFilesViewerOpen(true)} />
      )}
      {filesViewerOpen && (
        <FilesViewerModal
          files={[agreement.attachment]}
          openFileUrl={agreement.attachment.url}
          onClose={() => setFilesViewerOpen(false)}
          parentTitle={`${agreement.account.name} / ${agreement.title}`}
          allowOutsideInteraction
        />
      )}
    </Drawer>
  );
}
