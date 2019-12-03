import commentMutations from './CommentMutations';
import conversationMutations from './ConversationMutations';

const mutation = {
  ...commentMutations,
  ...conversationMutations,
};

export default mutation;
