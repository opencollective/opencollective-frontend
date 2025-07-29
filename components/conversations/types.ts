import type { CommentFieldsFragment } from '../../lib/graphql/types/v2/graphql';
import type { AccountType, CommentType } from '../../lib/graphql/types/v2/schema';

type CommentItem = CommentFieldsFragment;

type ThreadItem =
  | CommentItem
  | {
      __typename?: 'Activity';
      id: string;
    };

// Used in jsdoc comment of javascript Thread component
// ts-unused-exports:disable-next-line
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

// Used in jsdoc comment of javascript Thread component
// ts-unused-exports:disable-next-line
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

// Used in jsdoc comment of javascript Thread component
// ts-unused-exports:disable-next-line
export type CommentPropsWithVariant = CommentProps & {
  variant?: 'small';
};
