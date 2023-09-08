import React from 'react';

import { Agreement as GraphQLAgreement, FileInfo } from '../../lib/graphql/types/v2/graphql';

import { Drawer } from '../Drawer';

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
  onFilePreview: (file: FileInfo | string) => void;
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
  onFilePreview,
}: AgreementDrawerProps) {
  const [isEditing, setEditing] = React.useState<boolean>(false);

  const closeDrawer = React.useCallback(() => {
    setEditing(false);
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
          openFileViewer={onFilePreview}
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
          openFileViewer={onFilePreview}
        />
      ) : (
        <Agreement agreement={agreement} openFileViewer={() => onFilePreview(agreement.attachment)} />
      )}
    </Drawer>
  );
}
