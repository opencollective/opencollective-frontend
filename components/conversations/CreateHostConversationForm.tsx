import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { createError, ERROR, i18nGraphqlException } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import RichTextEditor from '../RichTextEditor';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useToast } from '../ui/useToast';

const createConversationMutation = gql`
  mutation CreateHostConversation(
    $title: String!
    $html: String!
    $account: AccountReferenceInput!
    $visibility: ConversationVisibility!
  ) {
    createConversation(title: $title, html: $html, account: $account, visibility: $visibility) {
      id
      slug
      title
      summary
      visibility
      createdAt
      fromAccount {
        id
        slug
        name
        type
        imageUrl
      }
      stats {
        id
        commentsCount
      }
    }
  }
`;

const validate = (values: { title: string; html: string }) => {
  const errors: { title?: object; html?: object } = {};
  const { title, html } = values;

  if (!title) {
    errors.title = createError(ERROR.FORM_FIELD_REQUIRED);
  } else if (title.length < 3) {
    errors.title = createError(ERROR.FORM_FIELD_MIN_LENGTH);
  } else if (title.length > 255) {
    errors.title = createError(ERROR.FORM_FIELD_MAX_LENGTH);
  }

  if (!html) {
    errors.html = createError(ERROR.FORM_FIELD_REQUIRED);
  } else if (html.length < 10) {
    errors.html = createError(ERROR.FORM_FIELD_MIN_LENGTH);
  }

  return errors;
};

type Conversation = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  visibility: string;
  createdAt: string;
  fromAccount: {
    id: string;
    slug: string;
    name: string;
    type: string;
    imageUrl: string;
  };
  stats: {
    id: string;
    commentsCount: number;
  };
};

type CreateHostConversationFormProps = {
  accountSlug: string;
  onSuccess: (conversation: Conversation) => void;
  onCancel: () => void;
};

export function CreateHostConversationForm({ accountSlug, onSuccess, onCancel }: CreateHostConversationFormProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [createConversation] = useMutation(createConversationMutation, {
    context: API_V2_CONTEXT,
  });

  const { values, errors, touched, handleChange, handleSubmit, isSubmitting, setFieldValue } = useFormik({
    initialValues: {
      title: '',
      html: '',
    },
    validate,
    onSubmit: async values => {
      try {
        const response = await createConversation({
          variables: {
            ...values,
            account: { slug: accountSlug },
            visibility: 'ADMINS_AND_HOST',
          },
          // Refetch the host conversations query
          refetchQueries: ['HostConversations'],
        });
        toast({
          variant: 'success',
          title: intl.formatMessage({ defaultMessage: 'Success', id: 'Success' }),
          message: intl.formatMessage({
            defaultMessage: 'Conversation created successfully',
            id: 'conversation.create.success',
          }),
        });
        onSuccess(response.data.createConversation);
      } catch (error) {
        toast({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Error', id: 'Error' }),
          message: i18nGraphqlException(intl, error),
        });
      }
    },
  });

  const handleRichTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue('html', event.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          <FormattedMessage defaultMessage="Title" id="conversation.form.title" />
        </Label>
        <Input
          id="title"
          name="title"
          value={values.title}
          onChange={handleChange}
          placeholder={intl.formatMessage({
            defaultMessage: 'Start with a title for your conversation',
            id: 'conversation.form.title.placeholder',
          })}
          className={touched.title && errors.title ? 'border-destructive' : ''}
        />
        {touched.title && errors.title && (
          <p className="text-sm text-destructive">{formatFormErrorMessage(intl, errors.title)}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="html">
          <FormattedMessage defaultMessage="Message" id="conversation.form.message" />
        </Label>
        <RichTextEditor
          inputName="html"
          defaultValue={values.html}
          onChange={handleRichTextChange}
          version="simplified"
          placeholder={intl.formatMessage({
            defaultMessage: 'Message for the fiscal host',
            id: 'Vaw/V/',
          })}
          editorMinHeight={150}
          withBorders={true}
          error={touched.html && errors.html}
          setUploading={setUploading}
          data-cy="conversation-message-editor"
        />
        {touched.html && errors.html && (
          <p className="text-sm text-destructive">{formatFormErrorMessage(intl, errors.html)}</p>
        )}
      </div>

      <div className="rounded-md bg-muted p-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <PrivateInfoIcon size={16} />
          <span>
            <FormattedMessage
              defaultMessage="This conversation will be private and only visible to {name}'s admins and the fiscal host."
              id="conversation.form.visibility.note"
              values={{ name: accountSlug }}
            />
          </span>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || uploading}>
          <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {uploading ? (
            <FormattedMessage defaultMessage="Uploading image..." id="uploadImage.isUploading" />
          ) : isSubmitting ? (
            <FormattedMessage defaultMessage="Creating..." id="conversation.form.creating" />
          ) : (
            <FormattedMessage defaultMessage="Create Conversation" id="conversation.form.submit" />
          )}
        </Button>
      </div>
    </form>
  );
}
