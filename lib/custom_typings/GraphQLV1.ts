import type { CollectiveType } from '../constants/collectives';
import type { Policies } from '../graphql/types/v2/graphql';

export type GraphQLV1Collective = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  longDescription?: string;
  createdAt?: string;
  hostFeePercent?: number | null;
  legalName: string;
  imageUrl: string;
  platformContributionAvailable?: boolean;
  type: keyof typeof CollectiveType;
  isArchived?: boolean;
  isPrivate?: boolean;
  isSuspended?: boolean;
  features?: Record<string, string>;
  parentCollective?: GraphQLV1Collective;
  isFirstPartyHost?: boolean;
  isTrustedHost?: boolean;
  isVerified?: boolean;
  currency?: string;
  settings?: Record<string, unknown>;
  isHost?: boolean;
  policies: Policies;
  children?: GraphQLV1Collective[];
  host?: GraphQLV1Collective;
  stats?: {
    balance?: number;
  };
};
