import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../../lib/constants/collectives';
import { createError, ERROR, i18nGraphqlException } from '../../../../lib/errors';
import { formatFormErrorMessage } from '../../../../lib/form-utils';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';

import CollectivePickerAsync from '../../../CollectivePickerAsync';
import PrivateInfoIcon from '../../../icons/PrivateInfoIcon';
import RichTextEditor from '../../../RichTextEditor';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Label } from '../../../ui/Label';
import { useToast } from '../../../ui/useToast';

const createConversationMutation = gql`
  mutation CreateHostConversation(
    $title: String!
    $html: String!
    $account: AccountReferenceInput!
    $host: AccountReferenceInput!
    $visibility: ConversationVisibility!
  ) {
    createConversation(title: $title, html: $html, account: $account, host: $host, visibility: $visibility) {
      id
      slug
      title
      summary
      visibility
      createdAt
      account {
        id
        slug
        name
        type
        imageUrl
      }
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


const validate = (values: { title: string; html: string; collective: unknown }) => {
    const errors: { title?: object; html?: object; collective?: object } = {};
    const { title, html, collective } = values;

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

    if (!collective) {
        errors.collective = createError(ERROR.FORM_FIELD_REQUIRED);
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
    account: {
        id: string;
        slug: string;
        name: string;
        type: string;
        imageUrl: string;
    };
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

type NewConversationModalProps = {
    hostSlug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (conversation: Conversation) => void;
};

export function NewConversationModal({ hostSlug, open, onOpenChange, onSuccess }: NewConversationModalProps) {
    const intl = useIntl();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);

    const [createConversation] = useMutation(createConversationMutation, {
        context: API_V2_CONTEXT,
    });

    const { values, errors, touched, handleChange, handleSubmit, isSubmitting, setFieldValue, resetForm } = useFormik({
        initialValues: {
            title: '',
            html: '',
            collective: null,
        },
        validate,
        onSubmit: async values => {
            try {
                const response = await createConversation({
                    variables: {
                        title: values.title,
                        html: values.html,
                        account: { legacyId: values.collective.value.id },
                        host: { slug: hostSlug },
                        visibility: 'ADMINS_AND_HOST',
                    },
                    refetchQueries: ['HostDashboardConversations'],
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
                resetForm();
                onOpenChange(false);
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

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    return (
        <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
            <div className="fixed inset-0 bg-black/50" onClick={handleClose} onKeyDown={(e) => e.key === 'Escape' && handleClose()} role="button" tabIndex={0} />
            <div className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform">
                <div className="rounded-lg bg-background p-6 shadow-lg">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold">
                            <FormattedMessage defaultMessage="New Conversation" id="host.dashboard.conversations.new" />
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            <FormattedMessage
                                defaultMessage="Start a conversation with one of your hosted collectives"
                                id="host.dashboard.conversations.new.description"
                            />
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="collective">
                                <FormattedMessage defaultMessage="Collective" id="conversation.form.collective" />
                            </Label>
                            <CollectivePickerAsync
                                inputId="collective"
                                types={[CollectiveType.COLLECTIVE, CollectiveType.FUND]}
                                limit={50}
                                value={values.collective}
                                onChange={collective => setFieldValue('collective', collective)}
                                placeholder={intl.formatMessage({
                                    defaultMessage: 'Select a collective',
                                    id: 'conversation.form.collective.placeholder',
                                })}
                                error={touched.collective && errors.collective}
                            />
                            {touched.collective && errors.collective && (
                                <p className="text-sm text-destructive">{formatFormErrorMessage(intl, errors.collective)}</p>
                            )}
                        </div>

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
                                    defaultMessage: 'Write your message here...',
                                    id: 'conversation.form.message.placeholder',
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
                                        defaultMessage="This conversation will be private and only visible to the collective's admins and the fiscal host."
                                        id="conversation.form.visibility.note"
                                    />
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting || uploading}>
                                <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                            </Button>
                            <Button type="submit" disabled={isSubmitting || uploading || !values.collective}>
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
                </div>
            </div>
        </div>
    );
}
