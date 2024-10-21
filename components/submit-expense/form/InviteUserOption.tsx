import React, { useId } from 'react';

import { Input, InputGroup } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Textarea } from '../../ui/Textarea';
import type { ExpenseForm } from '../useExpenseForm';

import { InviteeAccountType, InviteeOption } from './experiment';

type InviteUserOptionProps = {
  form: ExpenseForm;
};

export function InviteUserOption(props: InviteUserOptionProps) {
  const { setFieldValue } = props.form;
  return (
    <div>
      <div>Invite new user</div>
      {props.form.values.inviteeOption === InviteeOption.NEW_USER && (
        <div>
          <div className="px-4 pb-4">
            <Tabs
              id="lastSubmittedAccount"
              value={props.form.values.inviteeAccountType}
              onValueChange={newValue => setFieldValue('inviteeAccountType', newValue as InviteeAccountType)}
            >
              <TabsList>
                <TabsTrigger value={InviteeAccountType.INDIVIDUAL}>Personal Account</TabsTrigger>
                <TabsTrigger value={InviteeAccountType.ORGANIZATION}>Organization Account</TabsTrigger>
              </TabsList>
              <TabsContent value={InviteeAccountType.INDIVIDUAL}>
                <NewIndividualInviteeForm form={props.form} />
              </TabsContent>
              <TabsContent value={InviteeAccountType.ORGANIZATION}>
                <NewOrganizationInviteeForm form={props.form} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

type NewIndividualInviteeFormProps = {
  form: ExpenseForm;
};

function NewIndividualInviteeForm(props: NewIndividualInviteeFormProps) {
  const contactNameId = useId();
  const emailAddressId = useId();
  const individualNotesId = useId();

  return (
    <fieldset className="flex flex-col gap-4">
      <Label htmlFor={contactNameId}>Contact name</Label>
      <Input id={contactNameId} type="text" {...props.form.getFieldProps('inviteeNewIndividual.contactName')} />

      <Label htmlFor={emailAddressId}>Email address</Label>
      <Input id={emailAddressId} type="text" {...props.form.getFieldProps('inviteeNewIndividual.emailAddress')} />

      <Label htmlFor={individualNotesId}>Notes for the recipient (optional)</Label>
      <Textarea id={individualNotesId} {...props.form.getFieldProps('inviteeNewIndividual.notes')} />
    </fieldset>
  );
}

type NewOrganizationInviteeFormProps = {
  form: ExpenseForm;
};

function NewOrganizationInviteeForm(props: NewOrganizationInviteeFormProps) {
  return (
    <fieldset className="flex flex-col gap-4">
      <Label htmlFor="organizationName">Name of the organization</Label>
      <Input
        className="w-full"
        id="organizationName"
        type="text"
        {...props.form.getFieldProps('inviteeNewOrganization.name')}
      />

      <Label htmlFor="organizationSlug">Set profile URL</Label>
      <InputGroup
        className="w-full"
        prepend="opencollectice.com/"
        id="organizationSlug"
        type="text"
        {...props.form.getFieldProps('inviteeNewOrganization.slug')}
      />

      <Label htmlFor="website">Organization Website</Label>
      <InputGroup
        className="w-full"
        prepend="https://"
        id="website"
        type="text"
        {...props.form.getFieldProps('inviteeNewOrganization.website')}
      />

      <Label htmlFor="description">Organization Description</Label>
      <Input
        className="w-full"
        id="description"
        type="text"
        {...props.form.getFieldProps('inviteeNewOrganization.description')}
      />

      <Label htmlFor="contactName">Contact name</Label>
      <Input
        className="w-full"
        id="contactName"
        type="text"
        {...props.form.getFieldProps('inviteeNewOrganization.contactName')}
      />

      <Label htmlFor="emailAddress">Email Address</Label>
      <Input
        className="w-full"
        id="emailAddress"
        type="text"
        {...props.form.getFieldProps('inviteeNewOrganization.emailAddress')}
      />

      <Label htmlFor="notes">Notes</Label>
      <Textarea className="w-full" id="notes" {...props.form.getFieldProps('inviteeNewOrganization.notes')} />
    </fieldset>
  );
}
