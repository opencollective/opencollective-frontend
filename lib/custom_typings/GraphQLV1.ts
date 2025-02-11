import type { CollectiveType } from '../constants/collectives';

export type GraphQLV1Collective = {
  id: number;
  slug: string;
  name: string;
  legalName: string;
  imageUrl: string;
  type: keyof typeof CollectiveType;
  isArchived?: boolean;
  parentCollective?: GraphQLV1Collective;
  settings?: Record<string, unknown>;
  isHost?: boolean;
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
