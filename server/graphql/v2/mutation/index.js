import commentMutations from './CommentMutations';
import conversationMutations from './ConversationMutations';
import createCollectiveMutations from './CreateCollectiveMutations';

const mutation = {
  ...commentMutations,
  ...conversationMutations,
  ...createCollectiveMutations,
};

export default mutation;
