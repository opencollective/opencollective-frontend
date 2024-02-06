import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Span } from '../Text';

const EmojiLabel = styled(Span)`
  outline: 0;
  border: 1px solid #dadada;
  border-style: solid;
  border-width: 1px;
  border-radius: 100px;
  text-align: center;
  padding: 5px 14px 5px 14px;
  font-size: 12px;
  line-height: 14px;
  margin: 4px 8px 4px 0;
`;

const EmojiReactions = ({ reactions }) => {
  return Object.keys(reactions)
    .sort()
    .map(emoji => {
      return (
        <EmojiLabel key={emoji}>
          <span className="font-emoji">{emoji}</span>&nbsp;&nbsp;{reactions[emoji]}
        </EmojiLabel>
      );
    });
};

EmojiReactions.propTypes = {
  /** Reactions associated with this comment */
  reactions: PropTypes.object,
};

export default React.memo(EmojiReactions);
