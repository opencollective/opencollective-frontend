import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { DotsHorizontalRounded } from '@styled-icons/boxicons-regular/DotsHorizontalRounded';
import { Share2 as ShareIcon } from '@styled-icons/feather/Share2';
import { X } from '@styled-icons/feather/X';
import { Edit } from '@styled-icons/material/Edit';
import { FormattedMessage, useIntl } from 'react-intl';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useClipboard from '../../lib/hooks/useClipboard';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import ConfirmationModal from '../ConfirmationModal';
import Container from '../Container';
import { Flex } from '../Grid';
import HTMLContent from '../HTMLContent';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import { P } from '../Text';

import { CommentMetadata } from './CommentMetadata';

const AdminActionsPopupContainer = styled(Flex)`
  flex-direction: column;
  background: #ffffff;
  border: 1px solid rgba(49, 50, 51, 0.1);
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
  width: 184px;
  padding: 16px;
  z-index: 1;
`;

const CommentBtn = styled(StyledButton).attrs({ buttonSize: 'small' })`
  padding: 3px 5px;
  margin: 5px 0;
  width: 100%;
  text-align: left;
  border: none;

  span {
    margin-left: 12px;
    font-weight: 500;
    font-size: 14px;
    line-height: 21px;
    letter-spacing: -0.1px;
    vertical-align: middle;
  }
`;

/**
 * Action buttons for the comment owner. Styles change between mobile and desktop.
 */
const AdminActionButtons = ({
  canEdit,
  canDelete,
  openDeleteConfirmation,
  onEdit,
  copyLinkToClipboard,
  closePopup,
}) => {
  return (
    <React.Fragment>
      {/** Buttons */}
      <CommentBtn
        data-cy="share-comment-btn"
        onClick={() => {
          closePopup();
          copyLinkToClipboard();
        }}
      >
        <ShareIcon size="1em" mr={2} />
        <FormattedMessage tagName="span" id="Share" defaultMessage="Share" />
      </CommentBtn>
      {canEdit && (
        <CommentBtn
          data-cy="edit-comment-btn"
          onClick={() => {
            closePopup();
            onEdit();
          }}
        >
          <Edit size="1em" mr={2} />
          <FormattedMessage tagName="span" id="Edit" defaultMessage="Edit" />
        </CommentBtn>
      )}
      {canDelete && (
        <CommentBtn
          data-cy="delete-comment-btn"
          onClick={() => {
            closePopup();
            openDeleteConfirmation();
          }}
          color="red.600"
        >
          <X size="1em" mr={2} />
          <FormattedMessage tagName="span" id="actions.delete" defaultMessage="Delete" />
        </CommentBtn>
      )}
    </React.Fragment>
  );
};

AdminActionButtons.propTypes = {
  comment: PropTypes.object.isRequired,
  openDeleteConfirmation: PropTypes.func,
  onEdit: PropTypes.func,
  closePopup: PropTypes.func,
  isConversationRoot: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
  copyLinkToClipboard: PropTypes.func,
};

const deleteCommentMutation = gql`
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id) {
      id
    }
  }
`;

const REACT_POPPER_MODIFIERS = [
  {
    name: 'offset',
    options: {
      offset: [0, 8],
    },
  },
];

const mutationOptions = { context: API_V2_CONTEXT };

const CommentActions = ({ comment, anchorHash, isConversationRoot, canEdit, canDelete, onDelete, onEditClick }) => {
  const intl = useIntl();
  const { copy } = useClipboard();
  const [isDeleting, setDeleting] = React.useState(null);
  const [showAdminActions, setShowAdminActions] = React.useState(false);
  const [refElement, setRefElement] = React.useState(null);
  const [popperElement, setPopperElement] = React.useState(null);
  const [deleteComment, { error: deleteError }] = useMutation(deleteCommentMutation, mutationOptions);
  const { styles, attributes, state } = usePopper(refElement, popperElement, {
    placement: 'bottom-end',
    modifiers: REACT_POPPER_MODIFIERS,
  });

  const copyLinkToClipboard = () => {
    const [baseLink] = window.location.href.split('#');
    const linkWithAnchorHash = `${baseLink}#${anchorHash}`;
    copy(linkWithAnchorHash);
  };

  useGlobalBlur(state?.elements.popper, outside => {
    if (outside && showAdminActions) {
      setShowAdminActions(false);
    }
  });

  return (
    <React.Fragment>
      <div>
        <StyledButton
          ref={setRefElement}
          buttonSize="tiny"
          data-cy="commnent-actions-trigger"
          onClick={() => setShowAdminActions(!showAdminActions)}
        >
          <DotsHorizontalRounded size="16" />
        </StyledButton>
      </div>

      {showAdminActions && (
        <AdminActionsPopupContainer ref={setPopperElement} style={styles.popper} {...attributes.popper}>
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <P
              fontWeight="600"
              fontSize="9px"
              lineHeight="14px"
              textTransform="uppercase"
              letterSpacing="0.6px"
              whiteSpace="nowrap"
              pr={2}
            >
              <FormattedMessage id="comment.actions" defaultMessage="Comment Actions" />
            </P>
            <StyledHr flex="1" borderStyle="solid" borderColor="black.300" />
          </Flex>
          <Flex flexDirection="column" alignItems="flex-start">
            <AdminActionButtons
              comment={comment}
              isConversationRoot={isConversationRoot}
              openDeleteConfirmation={() => setDeleting(true)}
              onEdit={onEditClick}
              canEdit={canEdit}
              canDelete={canDelete}
              copyLinkToClipboard={copyLinkToClipboard}
              closePopup={() => setShowAdminActions(false)}
            />
          </Flex>
        </AdminActionsPopupContainer>
      )}
      {/** Confirm Modals */}
      {isDeleting && (
        <ConfirmationModal
          isDanger
          type="delete"
          onClose={() => setDeleting(false)}
          continueHandler={async () => {
            await deleteComment({ variables: { id: comment.id } });
            if (onDelete) {
              await onDelete(comment);
            }
          }}
          header={
            isConversationRoot ? (
              <FormattedMessage id="conversation.deleteModalTitle" defaultMessage="Delete this Conversation?" />
            ) : (
              <FormattedMessage id="Comment.DeleteConfirmTitle" defaultMessage="Delete this comment?" />
            )
          }
        >
          <StyledHr mb={4} borderColor="#e1e4e6" />
          {isConversationRoot && (
            <MessageBox type="warning" withIcon mb={3}>
              <FormattedMessage
                id="conversation.deleteMessage"
                defaultMessage="The message and all its replies will be permanently deleted."
              />
            </MessageBox>
          )}
          <Container padding={2} borderRadius={8} border="1px solid #e1e4e6">
            <CommentMetadata comment={comment} />
            <Container mt={3} maxHeight={150} overflowY="auto">
              <HTMLContent content={comment.html} fontSize="12px" data-cy="comment-body" />
            </Container>
          </Container>
          {deleteError && (
            <MessageBox type="error" withIcon mt={3}>
              {i18nGraphqlException(intl, deleteError)}
            </MessageBox>
          )}
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
};

CommentActions.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    html: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  /** needed to copy the comment link */
  anchorHash: PropTypes.string.isRequired,
  /** Can current user edit this comment? */
  canEdit: PropTypes.bool,
  /** Can current user delete this comment? */
  canDelete: PropTypes.bool,
  /** Set this to true if the comment is the root comment of a conversation */
  isConversationRoot: PropTypes.bool,
  /** Called when comment gets deleted */
  onDelete: PropTypes.func,
  /** Called when comment gets deleted */
  onEditClick: PropTypes.func,
};

export default CommentActions;
