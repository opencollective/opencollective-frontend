import React from 'react';

import StyledModal, { ModalBody } from '../StyledModal';

import type { AgreementFormProps } from './AgreementForm';
import AgreementForm from './AgreementForm';

type AddAgreementModalProps = {
  account?: AgreementFormProps['account'];
  onClose: () => void;
  onCreate: (GraphQLAgreement) => void;
  hostLegacyId: number;
};

export default function AddAgreementModal({
  onCreate,
  onClose,
  hostLegacyId,
  account,
  ...props
}: AddAgreementModalProps) {
  return (
    <StyledModal width={578} onClose={onClose} trapFocus {...props}>
      <ModalBody>
        <AgreementForm
          account={account}
          hostLegacyId={hostLegacyId}
          onCreate={onCreate}
          onCancel={onClose}
          disableDrawerActions
        />
      </ModalBody>
    </StyledModal>
  );
}
