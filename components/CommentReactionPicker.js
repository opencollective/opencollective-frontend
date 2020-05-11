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
import StyledLink from './StyledLink';
import { Span } from './Text';

const createCommentReactionMutation = gqlV2`
  mutation CreateCommentReaction($commentReaction: CommentReactionCreateInput!) {
    addCommentReaction(commentReaction: $commentReaction) {
      id
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
  const [selectedReactions, setSelectedReactions] = React.useState(reactions);
  const [createCommentReaction] = useMutation(createCommentReactionMutation, mutationOptions);

  useGlobalBlur(wrapperRef, outside => {
    if (outside) {
      setOpen(false);
    }
  });

  const handleEmojiSelect = async emoji => {
    const commentReaction = {
      emoji: emoji,
      comment: { id: comment.id },
      fromCollectiveId: { id: comment.fromCollective.id },
    };
    setOpen(false);
    const response = await createCommentReaction({ variables: { commentReaction } });
    if (response.data) {
      const updatedEmojiCount = {};
      updatedEmojiCount[emoji] = selectedReactions[emoji] ? selectedReactions[emoji] + 1 : 1;
      setSelectedReactions({ ...selectedReactions, ...updatedEmojiCount });
    }
  };

  return (
    <Container>
      {Object.entries(selectedReactions).map(([emoji, count]) => {
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
              <StyledLink
                textAlign="center"
                buttonStyle="standard"
                buttonSize="tiny"
                display="inline-block"
                mt={3}
                whiteSpace="nowrap"
                onClick={() => setOpen(true)}
                ref={ref}
              >
                <InsertEmoticon size="1.2em" />
              </StyledLink>
            )}
          </Reference>
          {open && (
            <Popper placement="bottom">
              {({ placement, ref, style }) => (
                <Container
                  border="0.1px solid #dadada"
                  data-placement={placement}
                  ref={ref}
                  style={{
                    backgroundColor: 'white',
                    zIndex: 9999,
                    ...style,
                  }}
                >
                  <Box>
                    {emojiFirstRow.map(emoji => {
                      return (
                        <StyledLink
                          key={emoji}
                          buttonStyle="borderless"
                          buttonSize="small"
                          mt={1}
                          mb={1}
                          display="inline-block"
                          whiteSpace="nowrap"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </StyledLink>
                      );
                    })}
                  </Box>
                  <Box>
                    {emojiSecondRow.map(emoji => {
                      return (
                        <StyledLink
                          key={emoji}
                          buttonStyle="borderless"
                          buttonSize="small"
                          display="inline-block"
                          whiteSpace="nowrap"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </StyledLink>
                      );
                    })}
                  </Box>
                </Container>
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
