import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { createError, ERROR, formatErrorMessage, getErrorFromGraphqlException } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import Container from '../Container';
import ContainerOverlay from '../ContainerOverlay';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import RichTextEditor from '../RichTextEditor';
import SignInOrJoinFree from '../SignInOrJoinFree';
import StyledButton from '../StyledButton';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import { commentFieldsFragment } from './graphql';

const createCommentMutation = gqlV2/* GraphQL */ `
  mutation CreateComment($comment: CommentCreateInput!) {
    createComment(comment: $comment) {
      ...CommentFields
    }
  }
  ${commentFieldsFragment}
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
  signInLabel: {
    id: 'CommentForm.SignIn',
    defaultMessage: 'Please sign in to comment:',
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

/** A small helper to make the form work with params from both API V1 & V2 */
const prepareCommentParams = (html, conversationId, expenseId, updateId) => {
  const comment = { html };
  if (conversationId) {
    comment.ConversationId = conversationId;
  } else if (expenseId) {
    comment.expense = {};
    if (typeof expenseId === 'string') {
      comment.expense.id = expenseId;
    } else {
      comment.expense.legacyId = expenseId;
    }
  } else if (updateId) {
    comment.update = {};
    if (typeof updateId === 'string') {
      comment.update.id = updateId;
    } else {
      comment.update.legacyId = updateId;
    }
  }
  return comment;
};

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
  isDisabled,
}) => {
  const [createComment, { loading, error }] = useMutation(createCommentMutation, mutationOptions);
  const intl = useIntl();
  const [html, setHtml] = useState('');
  const [resetValue, setResetValue] = useState();
  const [validationError, setValidationError] = useState();
  const { formatMessage } = intl;

  const submitForm = async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!html) {
      setValidationError(createError(ERROR.FORM_FIELD_REQUIRED));
    } else {
      const comment = prepareCommentParams(html, ConversationId, ExpenseId, UpdateId);
      const response = await createComment({ variables: { comment } });
      setResetValue(response.data.createComment.id);
      if (onSuccess) {
        return onSuccess(response.data.createComment);
      }
    }
  };

  return (
    <Container id={id} position="relative">
      {!loadingLoggedInUser && !LoggedInUser && (
        <ContainerOverlay backgroundType="white">
          <SignInOrJoinFree
            routes={{ join: getRedirectUrl(router, id) }}
            signInLabel={formatMessage(messages.signInLabel)}
            withShadow
          />
        </ContainerOverlay>
      )}
      <form onSubmit={submitForm} data-cy="comment-form">
        {loadingLoggedInUser ? (
          <LoadingPlaceholder height={232} />
        ) : (
          <RichTextEditor
            withBorders
            inputName="html"
            editorMinHeight={150}
            placeholder={formatMessage(messages.placeholder)}
            autoFocus={isAutoFocused(id)}
            disabled={isDisabled || !LoggedInUser || loading}
            reset={resetValue}
            fontSize="13px"
            onChange={e => {
              setHtml(e.target.value);
              setValidationError(null);
            }}
          />
        )}
        {validationError && (
          <P color="red.500" mt={3}>
            {formatFormErrorMessage(intl, validationError)}
          </P>
        )}
        {error && (
          <MessageBox type="error" withIcon mt={2}>
            {formatErrorMessage(intl, getErrorFromGraphqlException(error))}
          </MessageBox>
        )}
        <StyledButton
          type="submit"
          mt={3}
          minWidth={150}
          buttonStyle="primary"
          disabled={isDisabled || !LoggedInUser}
          loading={loading}
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
  ExpenseId: PropTypes.string,
  /** If commenting on an update */
  UpdateId: PropTypes.string,
  /** Called when the comment is created successfully */
  onSuccess: PropTypes.func,
  /** disable the inputs */
  isDisabled: PropTypes.bool,
  /** @ignore from withUser */
  loadingLoggedInUser: PropTypes.bool,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
  /** @ignore from withRouter */
  router: PropTypes.object,
};

export default withUser(withRouter(CommentForm));
