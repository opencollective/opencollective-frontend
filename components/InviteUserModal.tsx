import React, { useRef, useState } from 'react';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';

import { Button } from './ui/Button';
import { FormField } from './FormField';
import { FormikZod } from './FormikZod';

export const memberInfoSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
});

type InviteUserModalTriggerProps = {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: 'ORGANIZATION' | 'COLLECTIVE';
  onAddMember: (values: InviteUsersModalValuesSchema) => void;
  initialValue?: InviteUsersModalValuesSchema;
};

type InviteUsersModalValuesSchema = z.infer<typeof memberInfoSchema>;

export const InviteUserModalTrigger = ({
  children,
  title,
  description,
  type,
  onAddMember,
  initialValue,
}: InviteUserModalTriggerProps) => {
  const formikRef = useRef<FormikProps<InviteUsersModalValuesSchema>>(undefined);
  const [open, setOpen] = useState(false);

  const handleSubmit = (values: InviteUsersModalValuesSchema) => {
    onAddMember(values);
    setOpen(false);
    formikRef.current?.resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title || <FormattedMessage id="InviteUserModal.Title" defaultMessage="Invite User" />}
          </DialogTitle>
          <DialogDescription>
            {description || (
              <FormattedMessage
                defaultMessage="Invite additional administrators to help manage your {type, select, ORGANIZATION {organization} COLLECTIVE {collective} other {account}}."
                id="InviteTeamMember.Description"
                values={{ type }}
              />
            )}
          </DialogDescription>
        </DialogHeader>
        <FormikZod<InviteUsersModalValuesSchema>
          schema={memberInfoSchema}
          onSubmit={handleSubmit}
          initialValues={initialValue || {}}
          innerRef={formikRef}
        >
          {({ submitForm }) => (
            <Form className="flex flex-col gap-2" data-cy="invite-user-modal-form">
              <FormField name="name" label={<FormattedMessage defaultMessage="Name" id="Fields.name" />} />
              <FormField name="email" label={<FormattedMessage id="Email" defaultMessage="Email" />} type="email" />
              <DialogFooter>
                <Button type="button" onClick={submitForm} className="mt-2 w-full">
                  {initialValue ? (
                    <FormattedMessage id="InviteUserModal.UpdateUser" defaultMessage="Edit User" />
                  ) : (
                    <FormattedMessage id="InviteUserModal.AddUser" defaultMessage="Add User" />
                  )}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
};
