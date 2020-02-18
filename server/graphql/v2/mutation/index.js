import commentMutations from './CommentMutations';
import conversationMutations from './ConversationMutations';
import createCollectiveMutations from './CreateCollectiveMutations';
import expenseMutations from './ExpenseMutations';

const mutation = {
  ...commentMutations,
  ...conversationMutations,
  ...createCollectiveMutations,
  ...expenseMutations,
};

export default mutation;
