import React from 'react';

import { Agreement as GraphQLAgreement, FileInfo } from '../../lib/graphql/types/v2/graphql';

import { Drawer } from '../Drawer';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/Sheet';

import Agreement from './Agreement';
import AgreementForm from './AgreementForm';
import { AgreementWithActions } from './AgreementWithActions';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { ArrowLeft, ArrowRight, Badge, MoreHorizontal, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import LinkCollective from '../LinkCollective';
import Avatar from '../Avatar';
import DateTime from '../DateTime';

type AgreementDrawerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
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
  setOpen,
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
    <Sheet open={open} onOpenChange={setOpen} data-cy="agreement-drawer">
      <SheetContent size="lg">
        {/* <SheetHeader>
          <SheetTitle>Agreement</SheetTitle>
        </SheetHeader> */}
        <SheetHeader>
          <div className="flex w-full items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Agreements / <span className="font-normal">#4874</span>
            </p>
            <div className="flex items-center gap-1">
              {/* {status === HostApplicationStatus.PENDING && (
              <AcceptRejectButtons
                collective={account}
                isLoading={loading}
                disabled={requiresMinimumNumberOfAdmins && !hasEnoughInvitedAdmins}
                disabledMessage={
                  requiresMinimumNumberOfAdmins &&
                  !hasEnoughInvitedAdmins &&
                  intl.formatMessage({
                    defaultMessage:
                      'You can not approve this collective as it doesn’t satisfy the minimum admin policy set by you.',
                  })
                }
                onApprove={() => processApplication(ACTIONS.APPROVE)}
                onReject={message => processApplication(ACTIONS.REJECT, message)}
              />
            )}
            <Button
              variant="outline"
              // rounded
              // className="rounded-full"
              size={'sm-icon'}
              onClick={() => setShowContactModal(true)}
            >
              <MoreHorizontal size={16} />
            </Button> */}

              <Button variant="ghost" className="" size={'sm-icon'} onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
          </div>
          <div className="flex justify-between">
            <p className="text-lg font-medium text-foreground">
              {agreement?.title}
              {/* <StatusTag status={status} size={'lg'} /> */}
            </p>{' '}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                // rounded
                // className="rounded-full"
                size={'sm'}
                onClick={() => {}}
              >
                Edit
              </Button>
              <Button variant="outline" className="" size={'sm-icon'} onClick={onClose}>
                <MoreHorizontal size={16} />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <SheetBody>
          <Agreement agreement={agreement} openFileViewer={() => onFilePreview(agreement.attachment)} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
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
