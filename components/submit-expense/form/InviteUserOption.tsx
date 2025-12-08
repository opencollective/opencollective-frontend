import React from 'react';
import { useFormikContext } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { suggestSlug } from '@/lib/collective';
import { ExpenseLockableFields } from '@/lib/graphql/types/v2/schema';

import { FormField } from '../../FormField';
import { Input, InputGroup } from '../../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/Tabs';
import { Textarea } from '../../ui/Textarea';
import { type ExpenseForm, InviteeAccountType } from '../useExpenseForm';

type InviteUserOptionProps = {
  hideNotesField?: boolean;
  setFieldValue: ExpenseForm['setFieldValue'];
  isSubmitting: ExpenseForm['isSubmitting'];
  inviteeAccountType: ExpenseForm['values']['inviteeAccountType'];
  lockedFields: ExpenseForm['options']['lockedFields'];
};

export function InviteUserOption(props: InviteUserOptionProps) {
  const { setFieldValue } = props;
  const lockEmail = props.lockedFields?.includes?.(ExpenseLockableFields.PAYEE);
  return (
    <div>
      <div>
        <div className="">
          <Tabs
            id="lastSubmittedAccount"
            value={props.inviteeAccountType}
            onValueChange={newValue => setFieldValue('inviteeAccountType', newValue as InviteeAccountType)}
          >
            <TabsList>
              <TabsTrigger
                disabled={props.isSubmitting}
                value={InviteeAccountType.INDIVIDUAL}
                className="data-[state=active]:text-blue-900 data-[state=active]:shadow-sm"
              >
                <FormattedMessage defaultMessage="Personal Account" id="Sch2bu" />
              </TabsTrigger>
              <TabsTrigger
                disabled={props.isSubmitting}
                value={InviteeAccountType.ORGANIZATION}
                className="data-[state=active]:text-blue-900 data-[state=active]:shadow-sm"
              >
                <FormattedMessage defaultMessage="Organization Account" id="cS9oSV" />
              </TabsTrigger>
            </TabsList>
            <TabsContent value={InviteeAccountType.INDIVIDUAL}>
              <NewIndividualInviteeForm disableEmailField={lockEmail} hideNotesField={props.hideNotesField} />
            </TabsContent>
            <TabsContent value={InviteeAccountType.ORGANIZATION}>
              <NewOrganizationInviteeForm
                disableEmailField={lockEmail}
                hideNotesField={props.hideNotesField}
                setFieldValue={setFieldValue}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function NewIndividualInviteeForm(props: { hideNotesField?: boolean; disableEmailField?: boolean }) {
  const intl = useIntl();
  return (
    <fieldset className="flex flex-col gap-4">
      <FormField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Contact name', id: 'ContactName' })}
        name="inviteeNewIndividual.name"
      />

      <FormField
        disabled={props.disableEmailField}
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Email address', id: 'User.EmailAddress' })}
        name="inviteeNewIndividual.email"
      />

      {!props.hideNotesField && (
        <FormField
          isFastField
          label={intl.formatMessage({ defaultMessage: 'Notes for the recipient', id: '1Wu0qx' })}
          required={false}
          name="inviteNote"
        >
          {({ field }) => <Textarea className="w-full" {...field} />}
        </FormField>
      )}
    </fieldset>
  );
}

function NewOrganizationInviteeForm(props: {
  hideNotesField?: boolean;
  disableEmailField?: boolean;
  setFieldValue: ExpenseForm['setFieldValue'];
}) {
  const intl = useIntl();
  const { touched } = useFormikContext<ExpenseForm['values']>();
  return (
    <fieldset className="flex flex-col gap-4">
      <FormField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Name of the organization', id: 'KZfQ/g' })}
        name="inviteeNewOrganization.organization.name"
      >
        {({ field }) => (
          <Input
            className="w-full"
            type="text"
            {...field}
            onChange={e => {
              field.onChange(e);
              props.setFieldValue('inviteeNewOrganization.organization.name', e.target.value);
              if (!touched.inviteeNewOrganization?.organization?.slug) {
                props.setFieldValue('inviteeNewOrganization.organization.slug', suggestSlug(e.target.value));
              }
            }}
          />
        )}
      </FormField>

      <FormField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Set profile URL', id: 'ieO6cP' })}
        name="inviteeNewOrganization.organization.slug"
      >
        {({ field }) => (
          <InputGroup className="w-full" prepend="opencollective.com/" id="organizationSlug" type="text" {...field} />
        )}
      </FormField>

      <FormField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Organization Website', id: 'uN6AOo' })}
        name="inviteeNewOrganization.organization.website"
        required={false}
      >
        {({ field }) => <InputGroup className="w-full" prepend="https://" type="text" {...field} />}
      </FormField>

      <FormField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Organization Description', id: 'rClz3r' })}
        name="inviteeNewOrganization.organization.description"
      />
      <FormField
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Contact name', id: 'ContactName' })}
        name="inviteeNewOrganization.name"
      />

      <FormField
        disabled={props.disableEmailField}
        isFastField
        label={intl.formatMessage({ defaultMessage: 'Email Address', id: 'xxQxLE' })}
        name="inviteeNewOrganization.email"
      />

      {!props.hideNotesField && (
        <FormField
          isFastField
          label={intl.formatMessage({ defaultMessage: 'Notes for the recipient', id: '1Wu0qx' })}
          required={false}
          name="inviteNote"
        >
          {({ field }) => <Textarea className="w-full" {...field} />}
        </FormField>
      )}
    </fieldset>
  );
}
