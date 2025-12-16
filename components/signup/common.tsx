import React, { useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { Plus, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import roles from '@/lib/constants/roles';
import { formatErrorMessage, getErrorFromGraphqlException } from '@/lib/errors';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  CollectiveSignupMutation,
  InviteMembersMutation,
  InviteMembersMutationVariables,
  OrganizationSignupMutation,
} from '@/lib/graphql/types/v2/graphql';

import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import Image from '../Image';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { toast } from '../ui/useToast';

export enum SignupSteps {
  EMAIL_INPUT = 'EMAIL_INPUT',
  VERIFY_OTP = 'VERIFY_OTP',
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
  CREATE_ORG = 'CREATE_ORG',
  INVITE_ADMINS = 'INVITE_ADMINS',
  CREATE_COLLECTIVE = 'CREATE_COLLECTIVE',
}

const inviteMembersMutation = gql`
  mutation InviteMembers($account: AccountReferenceInput!, $members: [InviteMemberInput!]!) {
    inviteMembers(account: $account, members: $members) {
      id
    }
  }
`;

export type SignupStepProps = {
  step: SignupSteps;
  nextStep: (step?: SignupSteps, query?: Record<string, string | string[]>) => void;
  nextActionFlow?: 'organization' | 'collective';
  setCreatedAccount?: (
    organizationData: OrganizationSignupMutation['createOrganization'] | CollectiveSignupMutation['createCollective'],
  ) => void;
  createdAccount?: OrganizationSignupMutation['createOrganization'] | CollectiveSignupMutation['createCollective'];
};

const userInfoToAdminMember = ({ email, name }) => {
  return { memberInfo: { email, name }, role: roles.ADMIN };
};

const inviteAdminsSchema = z.object({
  invitedAdmins: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
      }),
    )
    .optional(),
});

type InviteAdminsValuesSchema = z.infer<typeof inviteAdminsSchema>;

export function InviteAdminForm({ nextStep, createdAccount }: SignupStepProps) {
  const intl = useIntl();
  const formikRef = useRef<FormikProps<InviteAdminsValuesSchema>>(undefined);
  const [inviteFieldsCount, setInviteFieldsCount] = useState(0);
  const [inviteMembers] = useMutation<InviteMembersMutation, InviteMembersMutationVariables>(inviteMembersMutation, {
    context: API_V2_CONTEXT,
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: InviteAdminsValuesSchema) => {
    const { invitedAdmins } = values;
    try {
      if (!createdAccount) {
        throw new Error('Organization not found');
      }
      setLoading(true);
      const members = (invitedAdmins || []).map(userInfoToAdminMember);
      await inviteMembers({
        variables: {
          account: { slug: createdAccount.slug },
          members,
        },
      });
      toast({
        variant: 'success',
        message: <FormattedMessage id="signup.inviteAdmins.success" defaultMessage="Invites sent!" />,
      });
      nextStep();
    } catch (error) {
      setLoading(false);
      const gqlError = getErrorFromGraphqlException(error);
      if (gqlError?.payload?.code?.includes('SLUG')) {
        formikRef.current?.setFieldError('organization.slug', formatErrorMessage(intl, gqlError));
      }
      toast({
        variant: 'error',
        message: formatErrorMessage(intl, gqlError) || (
          <FormattedMessage
            id="signup.inviteAdmins.error"
            defaultMessage="An error occurred while inviting your team"
          />
        ),
      });
    }
  };

  return (
    <FormikZod<InviteAdminsValuesSchema>
      schema={inviteAdminsSchema}
      onSubmit={onSubmit}
      initialValues={{}}
      innerRef={formikRef}
    >
      {({ values, setFieldValue, isValid }) => (
        <Form
          className="mb-6 flex max-w-xl grow flex-col items-center gap-8 px-6 sm:mb-20 sm:px-0"
          data-cy="invite-admins-form"
        >
          <Image width={80} height={62} src="/static/images/signup/invite.png" alt="Stars" />
          <div className="flex flex-col gap-2 px-3 text-center">
            <React.Fragment>
              <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                <FormattedMessage id="signup.inviteAdmins.title" defaultMessage="Invite your team" />
              </h1>
              <p className="text-sm break-words text-slate-700 sm:text-base">
                <FormattedMessage
                  defaultMessage="Having your team helps you share the work, adds accountability to manage finances transparently."
                  id="signup.inviteAdmins.description"
                />
              </p>
            </React.Fragment>
          </div>
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4">
              {inviteFieldsCount > 0 && (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: inviteFieldsCount }).map((_, index) => (
                    <div
                      // eslint-disable-next-line react/no-array-index-key
                      key={`invitedAdmin-${index}`}
                      className="flex items-start gap-2"
                    >
                      <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border p-4">
                        <FormField
                          name={`invitedAdmins.${index}.name`}
                          label={<FormattedMessage defaultMessage="Name" id="Fields.name" />}
                        >
                          {({ field }) => <Input {...field} placeholder="e.g. Jane Smith" />}
                        </FormField>
                        <FormField
                          name={`invitedAdmins.${index}.email`}
                          label={<FormattedMessage id="Email" defaultMessage="Email" />}
                          type="email"
                        >
                          {({ field }) => <Input {...field} placeholder="e.g. jane@example.com" />}
                        </FormField>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newInvitedAdmins = [...(values.invitedAdmins || [])];
                          newInvitedAdmins.splice(index, 1);
                          setFieldValue('invitedAdmins', newInvitedAdmins);
                          setInviteFieldsCount(inviteFieldsCount - 1);
                        }}
                        className="mt-1 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (inviteFieldsCount < 5) {
                    setInviteFieldsCount(inviteFieldsCount + 1);
                    const newInvitedAdmins = [...(values.invitedAdmins || [])];
                    newInvitedAdmins.push({ name: '', email: '' });
                    setFieldValue('invitedAdmins', newInvitedAdmins);
                  }
                }}
                disabled={inviteFieldsCount >= 5 || loading}
                className="w-full"
                data-cy="add-team-member"
              >
                <Plus className="h-4 w-4" />
                <FormattedMessage defaultMessage="Add Team Member" id="InviteTeamMember.add" />
              </Button>
            </CardContent>
          </Card>
          <div className="grow sm:hidden" />
          <div className="flex w-full max-w-lg flex-col-reverse gap-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="grow"
              disabled={loading}
              onClick={() => nextStep()}
              data-cy="skip-button"
            >
              {createdAccount.type === 'COLLECTIVE' ? (
                <FormattedMessage defaultMessage="Skip to my Profile" id="SkipToProfile" />
              ) : (
                <FormattedMessage defaultMessage="Skip to Dashboard" id="SkipToDashboard" />
              )}
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
              loading={loading}
              className="grow aria-hidden:hidden"
              aria-hidden={inviteFieldsCount === 0}
            >
              <FormattedMessage defaultMessage="Send Invite" id="Expense.SendInvite" />
            </Button>
          </div>
        </Form>
      )}
    </FormikZod>
  );
}
