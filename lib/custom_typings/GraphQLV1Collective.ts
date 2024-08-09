import type { CollectiveType } from '../../lib/constants/collectives';

export type GraphQLV1Collective = {
  id: number;
  slug: string;
  name: string;
  legalName: string;
  type: keyof typeof CollectiveType;
  isArchived?: boolean;
  parentCollective?: GraphQLV1Collective;
  settings?: Record<string, unknown>;
  isHost?: boolean;
};
