import React, { useRef } from 'react';
import { useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { Plus, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { suggestSlug } from '@/lib/collective';
import roles from '@/lib/constants/roles';
import { formatErrorMessage, getErrorFromGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';

import Avatar from '../../../Avatar';
import { FormField } from '../../../FormField';
import { FormikZod } from '../../../FormikZod';
import { InviteUserModalTrigger, memberInfoSchema } from '../../../InviteUserModal';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { InputGroup } from '../../../ui/Input';
import { Textarea } from '../../../ui/Textarea';
import { toast } from '../../../ui/useToast';

const createCollectiveFromHostMutation = gql`
  mutation CreateCollectiveFromHost(
    $collective: CollectiveCreateInput!
    $host: AccountReferenceInput!
    $inviteMembers: [InviteMemberInput!]
    $skipDefaultAdmin: Boolean
    $privateNote: String
  ) {
    createCollective(
      collective: $collective
      host: $host
      inviteMembers: $inviteMembers
      skipDefaultAdmin: $skipDefaultAdmin
      privateNote: $privateNote
    ) {
      id
      name
      slug
      description
      legacyId
      type
    }
  }
`;

const MAX_ADMINS = 5;

const createCollectiveSchema = z
  .object({
    collective: z.object({
      name: z.string().min(1).max(255),
      slug: z.string().min(1).max(255),
      description: z.preprocess(val => (val === '' ? undefined : val), z.string().max(255).optional()),
    }),
    invitedAdmins: z.array(memberInfoSchema).max(MAX_ADMINS).optional(),
    includeSelfAsAdmin: z.boolean().default(false),
    privateNote: z.string().max(1000).optional(),
  })
  .refine(data => data.includeSelfAsAdmin || (data.invitedAdmins && data.invitedAdmins.length > 0), {
    message: 'You must either add yourself as an admin or invite at least one admin',
    path: ['includeSelfAsAdmin'],
  });

type CreateCollectiveValuesSchema = z.infer<typeof createCollectiveSchema>;

type CreateCollectiveModalProps = {
  hostSlug: string;
  onClose: () => void;
  onSuccess?: () => void;
};

const CreateHostedCollectiveModal = ({ hostSlug, onClose, onSuccess }: CreateCollectiveModalProps) => {
  const intl = useIntl();
  const formikRef = useRef<FormikProps<CreateCollectiveValuesSchema>>(undefined);
  const [createCollective, { loading }] = useMutation(createCollectiveFromHostMutation);

  const onSubmit = async (values: CreateCollectiveValuesSchema) => {
    try {
      await createCollective({
        variables: {
          collective: values.collective,
          host: { slug: hostSlug },
          inviteMembers: (values.invitedAdmins || []).map(memberInfo => ({
            memberInfo,
            role: roles.ADMIN,
          })),
          skipDefaultAdmin: !values.includeSelfAsAdmin,
          privateNote: values.privateNote || null,
        },
      });
      toast({
        variant: 'success',
        message: intl.formatMessage({
          id: 'createCollective.form.success',
          defaultMessage: 'Collective created successfully!',
        }),
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const gqlError = getErrorFromGraphqlException(error);
      if (gqlError?.payload?.code?.includes('SLUG')) {
        formikRef.current?.setFieldError('collective.slug', formatErrorMessage(intl, gqlError));
      }
      toast({
        variant: 'error',
        message:
          formatErrorMessage(intl, gqlError) ||
          intl.formatMessage({
            defaultMessage: 'An error occurred while creating the collective',
            id: 'CreateCollective.Error',
          }),
      });
    }
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage defaultMessage="Create collective" id="CreateCollective" />
          </DialogTitle>
        </DialogHeader>
        <FormikZod<CreateCollectiveValuesSchema>
          schema={createCollectiveSchema}
          onSubmit={onSubmit}
          initialValues={{
            collective: { name: '', slug: '', description: '' },
            invitedAdmins: [],
            includeSelfAsAdmin: false,
            privateNote: '',
          }}
          innerRef={formikRef}
        >
          {({ values, touched, setFieldValue, isValid, submitForm }) => (
            <Form className="flex flex-col gap-4" data-cy="create-collective-form">
              <FormField
                name="collective.name"
                label={<FormattedMessage id="CollectiveName" defaultMessage="Collective's name" />}
                placeholder="e.g. Green Horizon"
                autoComplete="organization"
                onChange={e => {
                  setFieldValue('collective.name', e.target.value);
                  if (!touched.collective?.slug) {
                    setFieldValue('collective.slug', suggestSlug(e.target.value));
                  }
                }}
              />
              <FormField
                name="collective.slug"
                label={<FormattedMessage id="createCollective.form.slugLabel" defaultMessage="Set your profile URL" />}
              >
                {({ field }) => <InputGroup className="w-full" prepend="opencollective.com/" {...field} />}
              </FormField>
              <FormField
                name="collective.description"
                label={<FormattedMessage id="collective.description.label" defaultMessage="Short description" />}
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm leading-normal font-medium">
                  <FormattedMessage id="InviteAdministrators" defaultMessage="Invite Administrators" />
                </label>
                {(values.invitedAdmins?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {values.invitedAdmins.map((admin, index) => (
                      <InviteUserModalTrigger
                        // eslint-disable-next-line react/no-array-index-key
                        key={`invite-admin-trigger-${index}`}
                        type="COLLECTIVE"
                        title={<FormattedMessage id="editTeam.member.invite" defaultMessage="Invite Team Member" />}
                        onAddMember={memberInfo => {
                          const next = [...(values.invitedAdmins || [])];
                          next[index] = memberInfo;
                          setFieldValue('invitedAdmins', next);
                        }}
                        initialValue={admin}
                      >
                        <div className="flex cursor-pointer items-center rounded-full border px-1 py-1 text-sm transition-colors hover:border-blue-400 hover:bg-blue-100">
                          <Avatar size={20} name={admin.name} className="mr-2" fontSize={10} />
                          <span>{admin.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={e => {
                              e.stopPropagation();
                              const next = [...(values.invitedAdmins || [])];
                              next.splice(index, 1);
                              setFieldValue('invitedAdmins', next);
                            }}
                            className="ml-1 size-5"
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </InviteUserModalTrigger>
                    ))}
                  </div>
                )}
                <InviteUserModalTrigger
                  type="COLLECTIVE"
                  title={<FormattedMessage id="editTeam.member.invite" defaultMessage="Invite Team Member" />}
                  onAddMember={memberInfo => {
                    const next = [...(values.invitedAdmins || [])];
                    if (next.length < MAX_ADMINS) {
                      next.push(memberInfo);
                      setFieldValue('invitedAdmins', next);
                    }
                  }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={(values.invitedAdmins?.length ?? 0) >= MAX_ADMINS || loading}
                    className="w-full"
                    data-cy="add-team-member"
                  >
                    <Plus className="h-4 w-4" />
                    <FormattedMessage defaultMessage="Add Team Member" id="InviteTeamMember.add" />
                  </Button>
                </InviteUserModalTrigger>
              </div>

              <FormField
                name="privateNote"
                label={
                  <FormattedMessage
                    defaultMessage="Private note to invited admins"
                    id="CreateCollective.PrivateNote.Label"
                  />
                }
                hint={
                  <FormattedMessage
                    defaultMessage="This note will be included in the invitation email sent to the admins you invited."
                    id="CreateCollective.PrivateNote.Hint"
                  />
                }
              >
                {({ field }) => <Textarea {...field} rows={3} className="min-h-20" />}
              </FormField>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={values.includeSelfAsAdmin}
                  onCheckedChange={checked => setFieldValue('includeSelfAsAdmin', checked === true)}
                />
                <span>
                  <FormattedMessage
                    defaultMessage="Add me as an admin of this collective"
                    id="CreateCollective.AddSelfAsAdmin"
                  />
                </span>
              </label>

              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </Button>
                <Button type="button" onClick={submitForm} disabled={!isValid} loading={loading}>
                  <FormattedMessage defaultMessage="Create collective" id="CreateCollective" />
                </Button>
              </DialogFooter>
            </Form>
          )}
        </FormikZod>
      </DialogContent>
    </Dialog>
  );
};

export default CreateHostedCollectiveModal;
