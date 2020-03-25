import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { Flex, Box } from '@rebass/grid';
import { useMutation } from '@apollo/react-hooks';

import { gqlV2, API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { getErrorFromGraphqlException } from '../../lib/errors';
import StyledInput from '../StyledInput';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import MessageBox from '../MessageBox';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { P, H4 } from '../Text';
import StyledInputTags from '../StyledInputTags';
import CreateConversationFAQ from '../faqs/CreateConversationFAQ';
import FormPersister from '../../lib/form-persister';
import { withUser } from './../UserProvider';

const CreateConversationMutation = gqlV2`
  mutation CreateConversation($title: String!, $html: String!, $CollectiveId: String!, $tags: [String]) {
    createConversation(title: $title, html: $html, CollectiveId: $CollectiveId, tags: $tags) {
      id
      slug
      title
      summary
      tags
      createdAt
    }
  }
`;

const mutationOptions = { context: API_V2_CONTEXT };

const messages = defineMessages({
  titlePlaceholder: {
    id: 'CreateConversation.Title.Placeholder',
    defaultMessage: 'Start with a title for your conversation here',
  },
  bodyPlaceholder: {
    id: 'CreateConversation.Body.Placeholder',
    defaultMessage:
      'You can add links, lists, code snipets and more using this text editor. Type and start adding content to your conversation here.',
  },
});

/**
 * Form to create a new conversation. User must be authenticated.
 *
 * /!\ Can only be used with data from API V2.
 */
const CreateConversationForm = ({ collective, LoggedInUser, suggestedTags, onSuccess, disabled, loading }) => {
  const { formatMessage } = useIntl();
  const [createConversation, { error: submitError }] = useMutation(CreateConversationMutation, mutationOptions);
  const { register, watch, handleSubmit, errors, formState, setValue } = useForm();

  const [formPersister] = React.useState(new FormPersister());
  const conversationText = watch('html', '');
  const conversationTags = watch('tags', []);
  const conversationTitle = watch('title', '');

  const { id: collectiveId, slug: collectiveSlug } = collective;

  // Manually register custom fields
  useEffect(() => {
    register('html', { required: true });
    register('tags');
    register('title');
  }, []);

  useEffect(() => {
    if (!loading && LoggedInUser && !conversationTitle.length && !conversationText.length && !conversationTags.length) {
      const id = `conversation-${collectiveSlug}-${LoggedInUser.username}`;
      formPersister.setFormId(id);
    }

    const formValues = formPersister.loadValues();
    if (formValues && !conversationTitle.length && !conversationText.length && !conversationTags.length) {
      setValue('title', formValues['title']);
      setValue('html', formValues['html']);
      setValue('tags', formValues['tags']);
    }
  }, [loading, LoggedInUser]);

  useEffect(() => {
    formPersister.saveValues({ html: conversationText, tags: conversationTags, title: conversationTitle });
  }, [conversationTitle, conversationText, conversationTags]);

  return (
    <form
      onSubmit={handleSubmit(async values => {
        const response = await createConversation({ variables: { ...values, CollectiveId: collectiveId } });
        formPersister.clearValues();
        return onSuccess(response.data.createConversation);
      })}
    >
      <Flex flexWrap="wrap">
        <Box flex={['1 1 100%', null, null, '1 1']}>
          {loading ? (
            <LoadingPlaceholder height={36} />
          ) : (
            <StyledInput
              bare
              data-cy="conversation-title-input"
              error={errors.title}
              withOutline
              width="100%"
              fontSize="H4"
              border="none"
              name="title"
              maxLength={255}
              px={0}
              py={0}
              value={conversationTitle}
              onChange={e => setValue('title', e.target.value)}
              placeholder={formatMessage(messages.titlePlaceholder)}
              ref={register({ required: true, minLength: 3, maxLength: 255 })}
            />
          )}
          {errors.title && (
            <P color="red.500" mt={3}>
              {errors.title.type === 'required' && (
                <FormattedMessage id="Error.FieldRequired" defaultMessage="This field is required" />
              )}
              {errors.title.type === 'maxLength' && (
                <FormattedMessage
                  id="Error.MaxLength"
                  defaultMessage="Length must be less than {length}"
                  values={{ length: 255 }}
                />
              )}
            </P>
          )}
          <Box my={3}>
            {loading ? (
              <LoadingPlaceholder height={228} />
            ) : (
              <RichTextEditor
                withStickyToolbar
                toolbarOffsetY={0}
                placeholder={formatMessage(messages.bodyPlaceholder)}
                editorMinHeight={225}
                inputName="html"
                fontSize="13px"
                defaultValue={conversationText}
                onChange={e => setValue('html', e.target.value)}
                error={errors.title}
              />
            )}
          </Box>
          {errors.html && (
            <P color="red.500" mt={3}>
              <FormattedMessage id="Error.FieldRequired" defaultMessage="This field is required" />
            </P>
          )}
        </Box>
        <Box flex="0 1 300px" ml={[null, null, null, 4]}>
          <Box mb={4}>
            <H4 fontWeight="normal" mb={2}>
              <FormattedMessage id="Tags" defaultMessage="Tags" />
            </H4>
            <Box>
              {loading ? (
                <LoadingPlaceholder height={38} />
              ) : (
                <StyledInputTags
                  maxWidth={300}
                  suggestedTags={suggestedTags}
                  value={conversationTags}
                  onChange={options =>
                    setValue('tags', options && options.length > 0 ? options.map(option => option.value) : null)
                  }
                />
              )}
            </Box>
          </Box>
          <Box display={['none', null, null, 'block']}>
            <H4 fontWeight="normal" mb={2}>
              <FormattedMessage id="FAQ" defaultMessage="FAQ" />
            </H4>
            <CreateConversationFAQ title={null} withBorderLeft />
          </Box>
        </Box>
      </Flex>
      {submitError && (
        <MessageBox type="error" mt={3}>
          {getErrorFromGraphqlException(submitError).message}
        </MessageBox>
      )}
      <StyledButton
        type="submit"
        buttonStyle="primary"
        data-cy="submit-new-conversation-btn"
        disabled={disabled || loading}
        loading={formState.isSubmitting}
        minWidth={200}
        mt={3}
      >
        <FormattedMessage id="CreateConversationForm.Submit" defaultMessage="Submit conversation" />
      </StyledButton>
    </form>
  );
};

CreateConversationForm.propTypes = {
  /** the collective where the conversation will be created */
  collective: PropTypes.object.isRequired,
  /** Called when the conversation gets successfully created. Return a promise if you want to keep the submitting state active. */
  onSuccess: PropTypes.func.isRequired,
  /** Will disable the form */
  disabled: PropTypes.bool,
  /** Will show a loading state. Use this if loggedInUser or required data is not loaded yet. */
  loading: PropTypes.bool,
  /** Tags suggested for this new conversation */
  suggestedTags: PropTypes.arrayOf(PropTypes.string),
  /** LoggedInUser */
  LoggedInUser: PropTypes.object,
};

export default withUser(CreateConversationForm);
