import React from 'react';

import StyledInputFormikField from '../../StyledInputFormikField';
import { InputGroup } from '../../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Textarea } from '../../ui/Textarea';
import { type ExpenseForm, InviteeAccountType } from '../useExpenseForm';

type InviteUserOptionProps = {
  form: ExpenseForm;
};

export function InviteUserOption(props: InviteUserOptionProps) {
  const { setFieldValue } = props.form;
  return (
    <div>
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
              <NewIndividualInviteeForm />
            </TabsContent>
            <TabsContent value={InviteeAccountType.ORGANIZATION}>
              <NewOrganizationInviteeForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function NewIndividualInviteeForm() {
  return (
    <fieldset className="flex flex-col gap-4">
      <StyledInputFormikField isFastField label="Contact name" name="inviteeNewIndividual.name" />

      <StyledInputFormikField isFastField label="Email address" name="inviteeNewIndividual.email" />

      <StyledInputFormikField isFastField label="Notes for the recipient (optional)" name="inviteeNewIndividual.notes">
        {({ field }) => <Textarea className="w-full" {...field} />}
      </StyledInputFormikField>
    </fieldset>
  );
}

function NewOrganizationInviteeForm() {
  return (
    <fieldset className="flex flex-col gap-4">
      <StyledInputFormikField
        isFastField
        label="Name of the organization"
        name="inviteeNewOrganization.organization.name"
      />

      <StyledInputFormikField isFastField label="Set profile URL" name="inviteeNewOrganization.organization.slug">
        {({ field }) => (
          <InputGroup className="w-full" prepend="opencollectice.com/" id="organizationSlug" type="text" {...field} />
        )}
      </StyledInputFormikField>

      <StyledInputFormikField
        isFastField
        label="Organization Website"
        name="inviteeNewOrganization.organization.website"
      >
        {({ field }) => <InputGroup className="w-full" prepend="https://" type="text" {...field} />}
      </StyledInputFormikField>

      <StyledInputFormikField
        isFastField
        label="Organization Description"
        name="inviteeNewOrganization.organization.description"
      />
      <StyledInputFormikField isFastField label="Contact name" name="inviteeNewOrganization.name" />

      <StyledInputFormikField isFastField label="Email Address" name="inviteeNewOrganization.email" />

      <StyledInputFormikField
        isFastField
        label="Notes for the recipient (optional)"
        name="inviteeNewOrganization.notes"
      >
        {({ field }) => <Textarea className="w-full" {...field} />}
      </StyledInputFormikField>
    </fieldset>
  );
}
