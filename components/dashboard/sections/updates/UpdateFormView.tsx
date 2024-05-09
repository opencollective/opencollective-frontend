import React from 'react';
import { gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { Field, Form, Formik } from 'formik';
import { compact, isEmpty, pick, toString } from 'lodash';
import { ArrowLeft, BookCheck, BookDashed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

import { UPDATE_NOTIFICATION_AUDIENCE, UpdateNotificationAudienceLabels } from '../../../../lib/constants/updates';
import { toIsoDateStr } from '../../../../lib/date-utils';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getDashboardRoute } from '../../../../lib/url-helpers';
import { cn, formatDate } from '../../../../lib/utils';

import Link from '../../../Link';
import { useModal } from '../../../ModalContext';
import RichTextEditor from '../../../RichTextEditor';
import StyledInputFormikField from '../../../StyledInputFormikField';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Select, SelectContent, SelectItem, SelectTriggerMini, SelectValue } from '../../../ui/Select';
import { useToast } from '../../../ui/useToast';
import UpdateAudienceBreakdown from '../../../updates/UpdateAudienceBreakdown';
import { DashboardContext } from '../../DashboardContext';

import { MainColumn, SideColumn, SideColumnItem, TwoColumnContainer } from './common';
import { getRefetchQueries, updateFieldsFragment, updatesViewQuery } from './queries';

const CREATE_UPDATE_DEFAULT_VALUES = {
  notificationAudience: UPDATE_NOTIFICATION_AUDIENCE.ALL,
  isPrivate: false,
  isChangelog: false,
  publish: false,
};

const publishUpdateMutation = gql`
  mutation DashboardPublishUpdate($id: String!, $notificationAudience: UpdateAudience) {
    publishUpdate(id: $id, notificationAudience: $notificationAudience) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const unpublishUpdateMutation = gql`
  mutation DashboardUnpublishUpdate($id: String!) {
    unpublishUpdate(id: $id) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const createUpdateMutation = gql`
  mutation DashboardCreateUpdate($update: UpdateCreateInput!) {
    createUpdate(update: $update) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const editUpdateMutation = gql`
  mutation DashboardEditUpdate($update: UpdateUpdateInput!) {
    editUpdate(update: $update) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const updateAudienceQuery = gql`
  query UpdateDashboardAudience($id: String!, $audience: UpdateAudience) {
    update(id: $id) {
      id
      userCanPublishUpdate
      publishedAt
      isPrivate
      makePublicOn
      audienceStats(audience: $audience) {
        id
        total
        hosted
        individuals
        organizations
        collectives
        coreContributors
      }
      account {
        id
        isHost
      }
    }
  }
`;

const FormBody = ({ update }) => {
  const isEditing = !!update?.id;
  const isDraft = !update?.publishedAt;
  const initialValues = pick(
    update || CREATE_UPDATE_DEFAULT_VALUES,
    'id',
    'title',
    'html',
    'isPrivate',
    'makePublicOn',
    'isChangelog',
    'notificationAudience',
  );

  const intl = useIntl();
  const router = useRouter();
  const { showConfirmationModal } = useModal();
  const { toast } = useToast();
  const { account } = React.useContext(DashboardContext);
  const [uploading, setUploading] = React.useState(false);

  const [createUpdate] = useMutation(createUpdateMutation, { context: API_V2_CONTEXT });
  const [editUpdate] = useMutation(editUpdateMutation, { context: API_V2_CONTEXT, variables: { id: update?.id } });
  const [unpublishUpdate] = useMutation(unpublishUpdateMutation, {
    context: API_V2_CONTEXT,
  });
  const [publishUpdate] = useMutation(publishUpdateMutation, {
    context: API_V2_CONTEXT,
  });
  const [getAudienceData, { loading: audienceLoading }] = useLazyQuery(updateAudienceQuery, {
    context: API_V2_CONTEXT,
  });

  const refetchQueries = compact([
    ...getRefetchQueries(account),
    update && {
      query: updatesViewQuery,
      variables: { id: update.id },
      context: API_V2_CONTEXT,
    },
  ]);

  const handleSubmit = async (values, formik, redirect = true) => {
    const action = isEditing ? editUpdate : createUpdate;
    if (!isEditing) {
      values.account = { id: account.id };
    }
    try {
      const response = await action({
        variables: { update: values },
        refetchQueries,
      });
      toast({
        variant: 'success',
        message: isDraft ? (
          <FormattedMessage defaultMessage="Draft saved" id="draft.saved" />
        ) : (
          <FormattedMessage defaultMessage="Update saved" id="update.saved" />
        ),
      });
      const id = response.data.createUpdate?.id || response.data.editUpdate?.id;
      if (redirect) {
        router.push(getDashboardRoute(account, `updates/${id}`));
      } else {
        return id;
      }
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const handlePublish = async formik => {
    const values = formik.values;
    const id = await handleSubmit(values, null, false);
    const { data } = await getAudienceData({ variables: { id, audience: values.notificationAudience } });
    const audienceStats = data?.update?.audienceStats;
    showConfirmationModal({
      title: intl.formatMessage({
        defaultMessage: 'Are you sure you want to publish this update?',
        id: 'umr49S',
      }),
      description: <UpdateAudienceBreakdown audienceStats={audienceStats} />,
      onConfirm: async () => {
        try {
          await publishUpdate({
            variables: { notificationAudience: values.notificationAudience, id },
            refetchQueries,
          });
          toast({
            variant: 'success',
            message: <FormattedMessage defaultMessage="Update published" id="update.published" />,
          });
          router.push(getDashboardRoute(account, `updates/${id}`));
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      },
      confirmLabel: intl.formatMessage({ defaultMessage: 'Publish Update', id: 'Update.Publish.Title' }),
    });
  };

  const handleUnpublish = () =>
    showConfirmationModal({
      title: intl.formatMessage({
        defaultMessage: 'Are you sure you want to unpublish this update?',
        id: '6gmQrp',
      }),
      description: intl.formatMessage({
        defaultMessage:
          'This update will be moved back to drafts and will not be visible to the public. You can publish it again later.',
        id: 'update.unpublish.description',
      }),
      onConfirm: async () => {
        try {
          await unpublishUpdate({ variables: { id: update.id }, refetchQueries });
          toast({
            variant: 'success',
            message: <FormattedMessage defaultMessage="Update was unpublished" id="update.unpublished" />,
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      },
      confirmLabel: intl.formatMessage({ defaultMessage: 'Unpublish Update', id: 'Update.Unpublish.Title' }),
    });

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {formik => (
        <Form>
          <TwoColumnContainer>
            <MainColumn>
              <StyledInputFormikField
                name="title"
                label={<FormattedMessage id="Title" defaultMessage="Title" />}
                required
              >
                {({ field }) => <Input {...field} data-cy="update-title" className="flex-grow" maxLength={255} />}
              </StyledInputFormikField>
              <Field name="html">
                {({ field }) => (
                  <div>
                    <label htmlFor={field.id} className="mb-2 font-bold">
                      <FormattedMessage id="Update.Body" defaultMessage="Body" />
                    </label>
                    <RichTextEditor
                      kind="UPDATE"
                      {...field}
                      inputName={field.name}
                      editorMinHeight={300}
                      editorMaxHeight={'100%'}
                      defaultValue={field.value}
                      withBorders
                      data-cy="update-content-editor"
                      videoEmbedEnabled
                      setUploading={setUploading}
                      onChange={e => formik.setFieldValue(field.name, e.target.value)}
                    />
                    {uploading && (
                      <div className="mt-2 text-sm text-gray-500">
                        <FormattedMessage id="uploadImage.isUploading" defaultMessage="Uploading image..." />
                      </div>
                    )}
                  </div>
                )}
              </Field>
            </MainColumn>
            <SideColumn>
              <div className="flex gap-2 lg:flex-col lg:justify-stretch">
                {isDraft ? (
                  <React.Fragment>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handlePublish(formik)}
                      loading={audienceLoading}
                      data-cy="update-publish-btn"
                    >
                      <BookCheck size="16px" />
                      <FormattedMessage defaultMessage="Publish" id="update.publish.btn" />
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5"
                      data-cy="update-save-draft-btn"
                    >
                      <BookDashed size="16px" />
                      <FormattedMessage defaultMessage="Save Draft" id="YH2E7O" />
                    </Button>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Button type="submit" size="sm" className="w-full gap-1.5" data-cy="update-save-btn">
                      <BookCheck size="16px" />
                      <FormattedMessage defaultMessage="Save Changes" id="SaveChanges" />
                    </Button>
                    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={handleUnpublish}>
                      <BookDashed size="16px" />
                      <FormattedMessage defaultMessage="Move to Drafts" id="uRbxVi" />
                    </Button>
                  </React.Fragment>
                )}
              </div>
              <hr />
              <div className="flex flex-col gap-8 ">
                {isEditing && (
                  <SideColumnItem>
                    {update.publishedAt ? (
                      <FormattedMessage id="PublishedOn" defaultMessage="Published on" />
                    ) : (
                      <FormattedMessage id="DraftedOn" defaultMessage="Drafted on" />
                    )}
                    {formatDate(update.publishedAt || update.updatedAt, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </SideColumnItem>
                )}
                <SideColumnItem>
                  <FormattedMessage defaultMessage="Update type" id="jJmze4" />
                  <StyledInputFormikField name="isPrivate" labelFontSize="12px">
                    {({ field }) => (
                      <Select
                        value={formik.values.isChangelog ? 'changelog' : toString(field.value)}
                        onValueChange={value => {
                          if (value === 'changelog') {
                            formik.setFieldValue(field.name, false);
                            formik.setFieldValue('isChangelog', true);
                          } else {
                            const isPrivate = value === 'true';
                            formik.setFieldValue('isChangelog', false);
                            formik.setFieldValue(field.name, isPrivate);
                            if (isPrivate) {
                              formik.setFieldValue('makePublicOn', null);
                            }
                          }
                        }}
                      >
                        <SelectTriggerMini
                          id={field.name}
                          className={cn('truncate', { 'border-red-500': field.error })}
                          data-cy="update-type-select"
                        >
                          <SelectValue />
                        </SelectTriggerMini>
                        <SelectContent>
                          <SelectItem data-cy="update-type-public" value="false">
                            <FormattedMessage defaultMessage="Public" id="Public" />
                          </SelectItem>
                          <SelectItem data-cy="update-type-private" value="true">
                            <FormattedMessage defaultMessage="Private" id="Private" />
                          </SelectItem>
                          {account.slug === 'opencollective' && (
                            <SelectItem value="changelog">
                              <FormattedMessage id="update.type.changelog" defaultMessage="Changelog Entry" />
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </StyledInputFormikField>
                </SideColumnItem>
                {formik.values.isPrivate && (
                  <SideColumnItem>
                    <FormattedMessage id="Update.MakePublicOn" defaultMessage="Automatically make public on" />
                    <StyledInputFormikField name="makePublicOn" labelFontSize="12px" flexGrow={1} required={false}>
                      {({ field }) => (
                        <Input
                          {...field}
                          onChange={e => {
                            const value = isEmpty(e.target.value) ? null : dayjs(e.target.value).toISOString();
                            formik.setFieldValue(field.name, value);
                          }}
                          value={formik.values.makePublicOn ? toIsoDateStr(new Date(formik.values.makePublicOn)) : ''}
                          type="date"
                          width="100%"
                          maxWidth="40em"
                          min={toIsoDateStr(new Date())}
                        />
                      )}
                    </StyledInputFormikField>
                  </SideColumnItem>
                )}
                {!formik.values.isChangelog && (
                  <SideColumnItem>
                    {formik.values.isPrivate ? (
                      <FormattedMessage defaultMessage="Who can read this update?" id="/N24Lt" />
                    ) : (
                      <FormattedMessage defaultMessage="Who should be notified?" id="+JC301" />
                    )}

                    <StyledInputFormikField name="notificationAudience" labelFontSize="12px">
                      {({ field }) => (
                        <Select
                          {...field}
                          value={field.value}
                          onValueChange={value => formik.setFieldValue(field.name, value)}
                          disabled={!isDraft}
                        >
                          <SelectTriggerMini>
                            <SelectValue />
                          </SelectTriggerMini>
                          <SelectContent>
                            {Object.keys(UPDATE_NOTIFICATION_AUDIENCE).map(audience => (
                              <SelectItem value={audience} key={audience}>
                                {UpdateNotificationAudienceLabels[audience]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </StyledInputFormikField>
                  </SideColumnItem>
                )}
              </div>
            </SideColumn>
          </TwoColumnContainer>
        </Form>
      )}
    </Formik>
  );
};

const UpdateFormView = ({ updateId }) => {
  const isEditing = !!updateId;
  const { account } = React.useContext(DashboardContext);
  const { data, loading } = useQuery(updatesViewQuery, {
    variables: {
      id: updateId,
    },
    context: API_V2_CONTEXT,
    skip: !isEditing,
  });

  return (
    <div className="flex max-w-screen-lg flex-col-reverse xl:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <Link
          className="flex items-center text-sm text-gray-500"
          href={isEditing ? getDashboardRoute(account, `updates/${updateId}`) : getDashboardRoute(account, `updates`)}
        >
          <ArrowLeft size="14px" className="mr-1" />
          {isEditing ? (
            <FormattedMessage defaultMessage="Back to update" id="GdkxiL" />
          ) : (
            <FormattedMessage defaultMessage="Back to updates" id="isPw2F" />
          )}
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditing ? (
            <FormattedMessage defaultMessage="Edit Update" id="wEQDC6" />
          ) : (
            <FormattedMessage defaultMessage="New Update" id="+S3jp9" />
          )}
        </h1>
        {!loading && <FormBody update={data?.update} />}
      </div>
    </div>
  );
};

export default UpdateFormView;
