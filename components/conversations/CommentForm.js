import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Lock } from '@styled-icons/material/Lock';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import commentTypes from '../../lib/constants/commentTypes';
import { createError, ERROR, formatErrorMessage, getErrorFromGraphqlException } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import Container from '../Container';
import ContainerOverlay from '../ContainerOverlay';
import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import RichTextEditor from '../RichTextEditor';
import SignInOrJoinFree, { SignInOverlayBackground } from '../SignInOrJoinFree';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import { commentFieldsFragment } from './graphql';

const createCommentMutation = gql`
  mutation CreateComment($comment: CommentCreateInput!) {
    createComment(comment: $comment) {
      id
      ...CommentFields
    }
  }
  ${commentFieldsFragment}
`;

const messages = defineMessages({
  placeholder: {
    id: 'CommentForm.placeholder',
    defaultMessage: 'Type your message...',
  },
  postReply: {
    id: 'CommentForm.PostReply',
    defaultMessage: 'Post reply',
  },
  signInLabel: {
    id: 'CommentForm.SignIn',
    defaultMessage: 'Please sign in to comment:',
  },
  uploadingImage: {
    id: 'uploadImage.isUploading',
    defaultMessage: 'Uploading image...',
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
  canUsePrivateNote,
  defaultType = commentTypes.COMMENT,
  replyingToComment,
}) => {
  const [createComment, { loading, error }] = useMutation(createCommentMutation, mutationOptions);
  const intl = useIntl();
  const [html, setHtml] = useState('');
  const [resetValue, setResetValue] = useState();
  const [asPrivateNote, setPrivateNote] = useState(defaultType === commentTypes.PRIVATE_NOTE);
  const [validationError, setValidationError] = useState();
  const [uploading, setUploading] = useState(false);
  const { formatMessage } = intl;
  const isRichTextDisabled = isDisabled || !LoggedInUser || loading;

  const postComment = async event => {
    event.preventDefault();
    const type = asPrivateNote ? commentTypes.PRIVATE_NOTE : commentTypes.COMMENT;

    if (!html) {
      setValidationError(createError(ERROR.FORM_FIELD_REQUIRED));
    } else {
      const comment = prepareCommentParams(html, ConversationId, ExpenseId, UpdateId);
      if (type) {
        comment.type = type;
      }
      const response = await createComment({ variables: { comment } });
      setResetValue(response.data.createComment.id);
      if (onSuccess) {
        return onSuccess(response.data.createComment);
      }
    }
  };

  const getDefaultValueWhenReplying = () => {
    let value = `<blockquote><div>${replyingToComment.html}</div></blockquote>`;
    if (html) {
      value = `${value} ${html}`;
    }
    return value;
  };

  return (
    <Container id={id} position="relative">
      {!loadingLoggedInUser && !LoggedInUser && (
        <ContainerOverlay backgroundType="white">
          <SignInOverlayBackground>
            <SignInOrJoinFree
              routes={{ join: getRedirectUrl(router, id) }}
              signInLabel={formatMessage(messages.signInLabel)}
              hideFooter
              showSubHeading={false}
              showOCLogo={false}
              autoFocus={false}
            />
          </SignInOverlayBackground>
        </ContainerOverlay>
      )}
      <form onSubmit={postComment} data-cy="comment-form">
        {loadingLoggedInUser ? (
          <LoadingPlaceholder height={232} />
        ) : (
          //  When Key is updated the text editor default value will be updated too
          <div key={replyingToComment?.id}>
            <RichTextEditor
              defaultValue={replyingToComment?.id && getDefaultValueWhenReplying()}
              kind="COMMENT"
              withBorders
              inputName="html"
              editorMinHeight={250}
              placeholder={formatMessage(messages.placeholder)}
              autoFocus={Boolean(!isRichTextDisabled && isAutoFocused(id))}
              disabled={isRichTextDisabled}
              reset={resetValue}
              fontSize="13px"
              onChange={e => {
                setHtml(e.target.value);
                setValidationError(null);
              }}
              setUploading={setUploading}
            />
          </div>
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
        {canUsePrivateNote && (
          <Box mt={3} alignItems="center" gap={12}>
            <StyledCheckbox
              name="privateNote"
              label={
                <React.Fragment>
                  <FormattedMessage
                    id="CommentForm.PrivateNoteCheckbox"
                    defaultMessage="Post as a private note for the host admins"
                  />{' '}
                  <Lock size="1em" />
                </React.Fragment>
              }
              checked={asPrivateNote}
              onChange={() => setPrivateNote(!asPrivateNote)}
            />
          </Box>
        )}
        <Flex mt={3} alignItems="center" gap={12}>
          <StyledButton
            minWidth={150}
            buttonStyle="primary"
            disabled={isDisabled || !LoggedInUser || uploading}
            loading={loading}
            data-cy="submit-comment-btn"
            type="submit"
            name="submit-comment"
          >
            {formatMessage(uploading ? messages.uploadingImage : messages.postReply)}
          </StyledButton>
        </Flex>
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
  /** Default type of comment */
  defaultType: PropTypes.oneOf(Object.values(commentTypes)),
  /** Can post comment as private note */
  canUsePrivateNote: PropTypes.bool,
  /** @ignore from withUser */
  loadingLoggedInUser: PropTypes.bool,
  /** @ignore from withUser */
  LoggedInUser: PropTypes.object,
  replyingToComment: PropTypes.object,
  /** @ignore from withRouter */
  router: PropTypes.object,
  /** Called when comment gets selected*/
  getClickedComment: PropTypes.func,
};

export default withUser(withRouter(CommentForm));
