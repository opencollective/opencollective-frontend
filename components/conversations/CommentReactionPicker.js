import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import { Manager, Popper, Reference } from 'react-popper';
import styled, { css } from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';

import { Flex } from '../Grid';
import AddReactionIcon from '../icons/AddReactionIcon';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledRoundButton from '../StyledRoundButton';

const addCommentReactionMutation = gqlV2/* GraphQL */ `
  mutation AddCommentReaction($emoji: String!, $comment: CommentReferenceInput!) {
    addCommentReaction(emoji: $emoji, comment: $comment) {
      id
      reactions
      userReactions
    }
  }
`;

const removeCommentReactionMutation = gqlV2/* GraphQL */ `
  mutation RemoveCommentReaction($emoji: String!, $comment: CommentReferenceInput!) {
    removeCommentReaction(emoji: $emoji, comment: $comment) {
      id
      reactions
      userReactions
    }
  }
`;

const Emoji = styled.div`
  font-size: 15px;
`;

const ReactionButton = styled(StyledRoundButton).attrs({ isBorderless: true, buttonSize: 'small' })`
  margin: 4px;
  background: white !important;

  ${Emoji} {
    transition: transform 0.15s cubic-bezier(0.2, 0, 0.13, 2);
  }

  &:hover {
    ${Emoji} {
      transform: scale(1.3);
    }
  }

  ${props =>
    props.isSelected &&
    css`
      background: ${props.theme.colors.primary[200]} !important;
    `}
`;

const getOptimisticResponse = (comment, emoji, isAdding) => {
  const userReactions = comment.userReactions || [];
  if (isAdding) {
    const newCount = (comment.reactions[emoji] || 0) + 1;
    return {
      __typename: 'Mutation',
      addCommentReaction: {
        __typename: 'Comment',
        id: comment.id,
        reactions: { ...comment.reactions, [emoji]: newCount },
        userReactions: [...userReactions, emoji],
      },
    };
  } else {
    const newCount = (comment.reactions[emoji] || 0) - 1;
    const reactions = { ...comment.reactions, [emoji]: newCount };

    if (!reactions[emoji]) {
      delete reactions[emoji];
    }

    return {
      __typename: 'Mutation',
      removeCommentReaction: {
        __typename: 'Comment',
        id: comment.id,
        reactions,
        userReactions: userReactions.filter(userEmoji => userEmoji !== emoji),
      },
    };
  }
};

const mutationOptions = { context: API_V2_CONTEXT };

/**
 * A component to render the reaction picker on comments.
 */
const CommentReactionPicker = ({ comment }) => {
  const emojiFirstRow = ['👍️', '👎', '😀', '🎉'];
  const emojiSecondRow = ['😕', '❤️', '🚀', '👀'];
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef();
  const [addCommentReaction] = useMutation(addCommentReactionMutation, mutationOptions);
  const [removeCommentReaction] = useMutation(removeCommentReactionMutation, mutationOptions);

  useGlobalBlur(wrapperRef, outside => {
    if (outside) {
      setOpen(false);
    }
  });

  const getReactionBtnProps = emoji => {
    const isSelected = comment.userReactions?.includes(emoji);
    return {
      children: <Emoji>{emoji}</Emoji>,
      isSelected,
      onClick: () => {
        setOpen(false);
        const action = isSelected ? removeCommentReaction : addCommentReaction;
        return action({
          variables: { emoji: emoji, comment: { id: comment.id } },
          optimisticResponse: getOptimisticResponse(comment, emoji, !isSelected),
        });
      },
    };
  };

  return (
    <Manager>
      <div ref={wrapperRef}>
        <Reference>
          {({ ref }) => (
            <StyledButton
              buttonSize="tiny"
              display="inline-block"
              whiteSpace="nowrap"
              onClick={() => setOpen(true)}
              ref={ref}
              margin="4px 8px 4px 0"
              data-cy="comment-reaction-picker-trigger"
            >
              <AddReactionIcon />
            </StyledButton>
          )}
        </Reference>
        {open && (
          <Popper placement="bottom">
            {({ placement, ref, style }) => (
              <StyledCard
                boxShadow="-2px -1px 3px 0px #e8e8e8"
                zIndex={9999}
                data-placement={placement}
                ref={ref}
                style={style}
                data-cy="comment-reaction-picker-popper"
              >
                <Flex>
                  {emojiFirstRow.map(emoji => (
                    <ReactionButton key={emoji} {...getReactionBtnProps(emoji)} />
                  ))}
                </Flex>
                <Flex>
                  {emojiSecondRow.map(emoji => (
                    <ReactionButton key={emoji} {...getReactionBtnProps(emoji)} />
                  ))}
                </Flex>
              </StyledCard>
            )}
          </Popper>
        )}
      </div>
    </Manager>
  );
};

CommentReactionPicker.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    html: PropTypes.string,
    createdAt: PropTypes.string,
    fromCollective: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    }),
    userReactions: PropTypes.array,
  }).isRequired,
};

export default CommentReactionPicker;
