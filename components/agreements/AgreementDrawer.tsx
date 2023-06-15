import React from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage } from 'react-intl';

import { Agreement } from '../../lib/graphql/types/v2/graphql';

import Drawer, { useDrawerActionsContainer } from '../Drawer';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';

import AgreementView from './Agreement';
import AgreementForm from './AgreementForm';

export const AgreementDrawerSummary = ({ agreement, onEdit }) => {
  const drawerActionsContainer = useDrawerActionsContainer();
  return (
    <React.Fragment>
      <AgreementView agreement={agreement} />
      {drawerActionsContainer &&
        createPortal(
          <React.Fragment>
            <Flex justifyContent="space-between">
              <div></div>
              <StyledButton buttonStyle="secondary" onClick={onEdit}>
                <FormattedMessage defaultMessage="Edit Agreement" />
              </StyledButton>
            </Flex>
          </React.Fragment>,
          drawerActionsContainer,
        )}
    </React.Fragment>
  );
};

type AgreementDrawerState = 'view' | 'edit' | 'create';

type AgreementDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (Agreement) => void;
  onEdit: (Agreement) => void;
  agreement?: Agreement;
  hostLegacyId: number;
  defaultState: AgreementDrawerState;
};

export default function AgreementDrawer({
  open,
  onClose,
  onCreate,
  onEdit,
  agreement,
  hostLegacyId,
  defaultState = 'view',
}: AgreementDrawerProps) {
  const [state, setState] = React.useState<AgreementDrawerState>(defaultState);
  return (
    <Drawer maxWidth="512px" open={open} onClose={onClose} showActionsContainer>
      {['create', 'edit'].includes(state) ? (
        <AgreementForm hostLegacyId={hostLegacyId} agreement={agreement} onCreate={onCreate} onEdit={onEdit} />
      ) : (
        <AgreementDrawerSummary agreement={agreement} onEdit={() => setState('edit')} />
      )}
    </Drawer>
  );
}
