import { get } from 'lodash';
import { z } from 'zod';

import type { Account } from '../../lib/graphql/types/v2/graphql';

import { toast } from '../ui/useToast';

const coverImageSchema = z.object({
  type: z.literal('IMAGE').default('IMAGE'),
  url: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const coverVideoSchema = z.object({
  type: z.literal('VIDEO').default('VIDEO'),
  platform: z.enum(['youtube']).default('youtube'),
  videoUrl: z.string(),
});

const primaryColorSchema = z
  .string()
  .length(7)
  .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/i);

export const fundraiserSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(255).optional(),
  primaryColor: primaryColorSchema.optional(),
  cover: z.union([coverImageSchema, coverVideoSchema]).optional(),
  longDescription: z.string().max(30000).optional(),
});

export const profileSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(255).optional(),
  primaryColor: primaryColorSchema.optional(),
  cover: coverImageSchema.optional().nullable(),
  longDescription: z.string().max(30000).optional(),
});

export type Fundraiser = z.infer<typeof fundraiserSchema>;
type Profile = z.infer<typeof profileSchema>;

export function getDefaultFundraiserValues(account: Account): Fundraiser {
  if (!account) return null;
  const fundraiserSettings = account.settings.crowdfundingRedesign?.fundraiser || {};
  const primaryColor =
    get(account, 'settings.collectivePage.primaryColor') || get(account, 'parent.settings.collectivePage.primaryColor');

  return {
    name:
      fundraiserSettings?.name ??
      (['COLLECTIVE', 'ORGANIZATION'].includes(account.type) ? `Support ${account.name}` : account.name),
    description: fundraiserSettings?.description ?? account.description,
    primaryColor: fundraiserSettings?.primaryColor ?? primaryColor,
    cover: fundraiserSettings?.cover ?? {
      type: 'IMAGE',
      url: account.backgroundImageUrl,
      width: account.settings.collectivePage?.background?.mediaSize?.width,
      height: account.settings.collectivePage?.background?.mediaSize?.height,
    },
    longDescription: fundraiserSettings?.longDescription ?? account.longDescription,
  };
}

export function getDefaultProfileValues(account?: Account): Profile {
  if (!account) return null;
  const profileSettings = account.settings.crowdfundingRedesign?.profile || {};
  const primaryColor =
    get(account, 'settings.collectivePage.primaryColor') || get(account, 'parent.settings.collectivePage.primaryColor');

  return {
    name: profileSettings?.name ?? account.name,
    description: profileSettings?.description ?? account.description,
    primaryColor: profileSettings?.primaryColor ?? primaryColor,
    cover: profileSettings?.cover ?? {
      type: 'IMAGE',
      url: account.backgroundImageUrl,
      width: account.settings.collectivePage?.background?.mediaSize?.width,
      height: account.settings.collectivePage?.background?.mediaSize?.height,
    },
    longDescription: profileSettings?.longDescription ?? account.longDescription,
  };
}

export function getYouTubeIDFromUrl(url) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Naive goal aggregation
export function aggregateGoalAmounts(goals) {
  const totalAmount = goals.reduce((acc, goal) => acc + goal.amount, 0);
  return { amount: totalAmount };
}

export function triggerPrototypeToast() {
  toast({ message: 'Feature not implemented in prototype' });
}
