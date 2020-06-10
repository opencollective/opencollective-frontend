import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import { InsertEmoticon } from '@styled-icons/material';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import useGlobalBlur from '../lib/hooks/useGlobalBlur';

import Container from './Container';
import { Box } from './Grid';
import StyledButton from './StyledButton';
import StyledCard from './StyledCard';
import StyledRoundButton from './StyledRoundButton';
import { Span } from './Text';

const createCommentReactionMutation = gqlV2`
  mutation CreateCommentReaction($emoji: String!, $comment: CommentReferenceInput!, $fromAccount: AccountReferenceInput!) {
    addCommentReaction(emoji: $emoji, comment: $comment, fromAccount: $fromAccount) {
      id
      reactions
    }
  }
`;

const mutationOptions = { context: API_V2_CONTEXT };

const EmojiLabel = styled(Span)`
  outline: 0;
  border: 1px solid #dadada;
  border-style: solid;
  border-width: 1px;
  border-radius: 100px;
  text-align: center;
  padding: 5px 14px 5px 14px;
  font-size: 12px;
  line-height: 12px;
}

  &:disabled {
    cursor: not-allowed;
  }
`;

/**
 * A component to render the reaction picker on comments.
 */
const CommentReactionPicker = ({ comment, reactions }) => {
  const emojiFirstRow = ['👍️', '👎', '😀', '🎉'];
  const emojiSecondRow = ['😕', '❤️', '🚀', '👀'];
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef();
  const [createCommentReaction] = useMutation(createCommentReactionMutation, mutationOptions);

  useGlobalBlur(wrapperRef, outside => {
    if (outside) {
      setOpen(false);
    }
  });

  const handleEmojiSelect = async emoji => {
    setOpen(false);
    await createCommentReaction({
      variables: {
        emoji: emoji,
        comment: { id: comment.id },
        fromAccount: { id: comment.fromCollective.id },
      },
    });
  };

  return (
    <Container>
      {Object.entries(reactions).map(([emoji, count]) => {
        return (
          <EmojiLabel key={emoji} display="inline-block" mt={3} mr={2}>
            {`${emoji} ${count}`}
          </EmojiLabel>
        );
      })}
      <Manager>
        <span ref={wrapperRef}>
          <Reference>
            {({ ref }) => (
              <StyledButton
                buttonSize="tiny"
                display="inline-block"
                mt={3}
                whiteSpace="nowrap"
                onClick={() => setOpen(true)}
                ref={ref}
              >
                <InsertEmoticon size="1.2em" />
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
                >
                  <Box>
                    {emojiFirstRow.map(emoji => {
                      return (
                        <StyledRoundButton
                          key={emoji}
                          isBorderless
                          buttonSize="small"
                          m={1}
                          display="inline-block"
                          whiteSpace="nowrap"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </StyledRoundButton>
                      );
                    })}
                  </Box>
                  <Box>
                    {emojiSecondRow.map(emoji => {
                      return (
                        <StyledRoundButton
                          key={emoji}
                          m={1}
                          isBorderless
                          buttonSize="small"
                          display="inline-block"
                          whiteSpace="nowrap"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </StyledRoundButton>
                      );
                    })}
                  </Box>
                </StyledCard>
              )}
            </Popper>
          )}
        </span>
      </Manager>
    </Container>
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
  }).isRequired,
  /** Reactions associated with this comment? */
  reactions: PropTypes.object,
};

export default CommentReactionPicker;
