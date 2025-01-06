import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';

import type { Account } from '../lib/graphql/types/v2/schema';

import EditVirtualCardModal from './edit-collective/EditVirtualCardModal';
import { useToast } from './ui/useToast';
import StyledButton from './StyledButton';

interface CreateVirtualCardBtnProps {
  children: (props: { onClick: () => void }) => React.ReactNode;
  host: Account;
  collective: Account;
}

const DefaultButton = props => (
  <StyledButton {...props}>
    <FormattedMessage defaultMessage="Create a Card" id="xLybrm" />
  </StyledButton>
);

const CreateVirtualCardBtn = ({ children = DefaultButton, host, collective }: CreateVirtualCardBtnProps) => {
  const [showModal, setShowModal] = React.useState(false);
  const { toast } = useToast();

  const handleCreateCardSuccess = () => {
    toast({
      variant: 'success',
      message: <FormattedMessage defaultMessage="Card successfully created" id="YdC/Ok" />,
    });
    setShowModal(false);
  };

  return (
    <Fragment>
      {children({ onClick: () => setShowModal(true) })}
      {showModal && (
        <EditVirtualCardModal
          host={host}
          collective={collective}
          onClose={() => setShowModal(false)}
          onSuccess={handleCreateCardSuccess}
        />
      )}
    </Fragment>
  );
};

export default CreateVirtualCardBtn;
