import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import { withRouter } from 'next/router';
import { get } from 'lodash';
import useForm from 'react-hook-form';
import { useMutation } from 'react-apollo';

import { gqlV2, API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { getErrorFromGraphqlException } from '../../lib/utils';
import RichTextEditor from '../RichTextEditor';
import StyledButton from '../StyledButton';
import { withUser } from '../UserProvider';
import LoadingPlaceholder from '../LoadingPlaceholder';
import SignInOrJoinFree from '../SignInOrJoinFree';
import Container from '../Container';
import ContainerOverlay from '../ContainerOverlay';
import MessageBox from '../MessageBox';
import { CommentFieldsFragment } from './graphql';

const createCommentMutation = gqlV2`
  mutation CreateComment($comment: CommentCreate!) {
    createComment(comment: $comment) {
      ...CommentFields
    }
  }
  ${CommentFieldsFragment}
`;

const messages = defineMessages({
  placeholder: {
    id: 'CommentForm.placeholder',
    defaultMessage: 'Type in your message...',
  },
  postReply: {
    id: 'CommentForm.PostReply',
    defaultMessage: 'Post reply',
  },
});

const getRedirectUrl = (router, id) => {
  const anchor = id ? `#${id}` : '';
  return `/create-account?next=${encodeURIComponent(router.asPath + anchor)}`;
};

const isAutoFocused = id => {
  return id && typeof window !== 'undefined' && get(window, 'location.hash') === `#${id}`;
};

const mutationOptions = { context: API_V2_CONTEXT };

/**
 * Form for users to post comments on either expenses, conversations or updates.
 * If user is not logged in, the form will default to a sign in/up form.
 */
const CommentForm = ({
  id,
  ConversationId,
  ExpenseId,
  UpdateId,
  onSuccess,
  router,
  loadingLoggedInUser,
  LoggedInUser,
}) => {
  const [createComment, { error, data }] = useMutation(createCommentMutation, mutationOptions);
  const { register, triggerValidation, setValue, formState, handleSubmit } = useForm({ mode: 'onChange' });
  const { formatMessage } = useIntl();

  // Manually register custom fields
  React.useEffect(() => {
    register({ name: 'html' }, { required: true });
  }, []);

  // Called by react-hook-form when submitting the form
  const submit = async values => {
    const comment = { ...values, ConversationId, ExpenseId, UpdateId };
    const response = await createComment({ variables: { comment } });
    if (onSuccess) {
      return onSuccess(response.data.createComment);
    }
  };

  return (
    <Container id={id} position="relative">
      {!loadingLoggedInUser && !LoggedInUser && (
        <ContainerOverlay>
          <SignInOrJoinFree routes={{ join: getRedirectUrl(router, id) }} />
        </ContainerOverlay>
      )}
      <form onSubmit={handleSubmit(submit)} data-cy="comment-form">
        {loadingLoggedInUser ? (
          <LoadingPlaceholder height={232} />
        ) : (
          <RichTextEditor
            withBorders
            inputName="html"
            editorMinHeight={150}
            placeholder={formatMessage(messages.placeholder)}
            autoFocus={isAutoFocused(id)}
            disabled={!LoggedInUser || formState.isSubmitting}
            reset={get(data, 'createComment.id')}
            fontSize="13px"
            onChange={e => {
              setValue('html', e.target.value);
              triggerValidation();
            }}
          />
        )}
        {error && (
          <MessageBox type="error" withIcon mt={2}>
            {getErrorFromGraphqlException(error).message}
          </MessageBox>
        )}
        <StyledButton
          type="submit"
          mt={3}
          minWidth={150}
          buttonStyle="primary"
          disabled={!LoggedInUser || !formState.isValid}
          loading={formState.isSubmitting}
          data-cy="submit-comment-btn"
        >
          {formatMessage(messages.postReply)}
        </StyledButton>
      </form>
    </Container>
  );
};

CommentForm.propTypes = {
  /** An optional id for the container, useful for the redirection link */
  id: PropTypes.string,
  /** If commenting on a conversation */
  ConversationId: PropTypes.string,
  /** If commenting on an expense */
  ExpenseId: PropTypes.number,
  /** If commenting on an update */
  UpdateId: PropTypes.number,
  /** Called when the comment is created successfully */
  onSuccess: PropTypes.func,
  /** @ignore from withUser */
  loadingLoggedInUser: PropTypes.bool,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
  /** @ignore from withRouter */
  router: PropTypes.object,
};

export default withUser(withRouter(CommentForm));
