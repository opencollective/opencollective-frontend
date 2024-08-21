import type { AccountType, CommentFieldsFragment, CommentType } from '../../lib/graphql/types/v2/graphql';

type CommentItem = CommentFieldsFragment;

type ThreadItem =
  | CommentItem
  | {
      __typename?: 'Activity';
      id: string;
    };
export type ThreadProps = {
  items: ThreadItem[];
  onCommentDeleted?: (comment: CommentItem) => void;
  collective?: { slug: string; type: AccountType };
  hasMore: boolean;
  loading?: boolean;
  fetchMore?: () => void;
  getClickedComment?: (comment: CommentItem) => void;
};

export type SmallThreadProps = ThreadProps & {
  variant: 'small';
  CommentEntity?: { HostApplicationId: string } | { ExpenseId: string };
  onCommentCreated: (comment: CommentItem) => Promise<void> | void;
  canUsePrivateNote?: boolean;
  defaultType?: CommentType;
  canComment?: boolean;
};

export type ThreadPropsWithVariant = ThreadProps | SmallThreadProps;

export type CommentProps = {
  comment: CommentItem;
  reactions: object;
  canEdit?: boolean;
  canDelete?: boolean;
  canReply?: boolean;
  isConversationRoot?: boolean;
  withoutActions?: boolean;
  maxCommentHeight?: number;
  onDelete: (comment: CommentItem) => Promise<void> | void;
  onReplyClick: (comment: CommentItem) => void;
};

export type CommentPropsWithVariant = CommentProps & {
  variant?: 'small';
};
