import type { CollectiveType } from '../constants/collectives';
import type { Policies } from '../graphql/types/v2/graphql';

export type GraphQLV1Collective = {
  id: number;
  slug: string;
  name: string;
  legalName: string;
  imageUrl: string;
  type: keyof typeof CollectiveType;
  isArchived?: boolean;
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

export interface GraphQLV1PaymentMethod {
  id: string;
  uuid: string;
  currency: string;
  name: string;
  service: string;
  type: string;
  batch: string;
  data: any;
  initialBalance: number;
  monthlyLimitPerMember: number;
  balance: number;
  expiryDate: string;
  isConfirmed: boolean;
  createdAt: string;
  description: string;
  collective: GraphQLV1Collective;
}
