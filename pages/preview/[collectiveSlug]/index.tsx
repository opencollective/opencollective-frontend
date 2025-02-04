import React from 'react';
import { useQuery } from '@apollo/client';
import { Markup } from 'interweave';
import { useRouter } from 'next/router';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';

import { ContentOverview } from '../../../components/crowdfunding-redesign/ContentOverview';
import { GoalProgress } from '../../../components/crowdfunding-redesign/GoalProgress';
import {
  getDefaultFundraiserValues,
  getDefaultProfileValues,
  getYouTubeIDFromUrl,
} from '../../../components/crowdfunding-redesign/helpers';
import ProfileLayout from '../../../components/crowdfunding-redesign/ProfileLayout';
import { contributePageQuery } from '../../../components/crowdfunding-redesign/queries';
import { Tiers } from '../../../components/crowdfunding-redesign/Tiers';
import Link from '../../../components/Link';

function FundraiserCard({ account, collectiveSlug }) {
  const fundraiser = getDefaultFundraiserValues(account);

  return (
    <Link
      className="flex flex-col gap-1 overflow-hidden rounded-md border bg-white"
      key={account.slug}
      href={`/preview/${collectiveSlug}/${account.type === 'EVENT' ? 'events' : 'projects'}/${account.slug}`}
    >
      {fundraiser.cover?.type === 'IMAGE' && fundraiser.cover.url ? (
        <img src={fundraiser.cover.url} alt="" className="-mb-2 aspect-video h-full w-full object-cover" />
      ) : fundraiser.cover?.type === 'VIDEO' ? (
        <img
          src={`https://i.ytimg.com/vi/${getYouTubeIDFromUrl(fundraiser.cover.videoUrl)}/maxresdefault.jpg`}
          alt=""
          className="-mb-2 aspect-video h-full w-full object-cover"
        />
      ) : (
        <div className="h-[120px] w-full">
          <PatternBg />
        </div>
      )}
      <div className="flex flex-col gap-4 p-4">
        <div className="space-y-1">
          <div className="text-xl font-semibold tracking-tight">{fundraiser.name}</div>
          {fundraiser.description && <div className="text-sm">{fundraiser.description}</div>}
        </div>

        <div>
          <div className="flex flex-col gap-4 text-muted-foreground">
            {fundraiser.goal && <GoalProgress accountSlug={account.slug} goal={fundraiser.goal} />}
          </div>
        </div>
      </div>
    </Link>
  );
}

// next.js export
// ts-unused-exports:disable-next-line
export default function ContributePage() {
  const router = useRouter();
  const { data } = useQuery(contributePageQuery, {
    variables: { slug: router.query.collectiveSlug },
    context: API_V2_CONTEXT,
  });
  const profile = getDefaultProfileValues(data?.account);
  const mainfundraising = true;

  return (
    <ProfileLayout activeTab="home">
      <div className="flex-1 space-y-8">
        {mainfundraising && (
          <div className="border-b bg-white py-12">
            <div className="gap- relative mx-auto grid max-w-(--breakpoint-xl) grid-cols-12 px-6">
              <div className="col-span-2">
                <div className="sticky top-28 space-y-4">
                  <ContentOverview content={profile?.longDescription} />
                </div>
              </div>

              <div className="col-span-7 prose prose-slate">
                <h3>About</h3>
                <Markup
                  noWrap
                  content={profile?.longDescription ?? ''}
                  allowAttributes
                  transform={node => {
                    // Allow some iframes
                    if (node.tagName.toLowerCase() === 'iframe') {
                      const src = node.getAttribute('src');
                      const parsedUrl = new URL(src);
                      const hostname = parsedUrl.hostname;
                      if (['youtube-nocookie.com', 'www.youtube-nocookie.com', 'anchor.fm'].includes(hostname)) {
                        return (
                          <iframe
                            width={node.getAttribute('width')}
                            height={node.getAttribute('height')}
                            allowFullScreen={node.getAttribute('allowfullscreen') as any}
                            title={node.getAttribute('title') || 'Embed content'}
                            src={src}
                          />
                        );
                      }
                    } else if (node.tagName.toLowerCase() === 'a') {
                      // Open links in new tab
                      node.setAttribute('target', '_blank');
                      node.setAttribute('rel', 'noopener noreferrer');
                    }
                  }}
                />
              </div>
              <div className="col-span-3 space-y-6">
                {profile?.goal && <GoalProgress accountSlug={data?.account.slug} goal={profile?.goal} />}
                {data?.account?.tiers && <Tiers account={data?.account} />}
              </div>
            </div>
          </div>
        )}

        {(data?.projects?.totalCount > 0 || data?.events?.totalCount > 0) && (
          <div className="mx-auto max-w-(--breakpoint-xl) space-y-8 px-6 py-12">
            {data?.projects?.totalCount > 0 && (
              <React.Fragment>
                <h3 className="text-2xl leading-none font-semibold tracking-tight">Projects</h3>
                <div className="grid grid-cols-3 gap-4">
                  {data?.projects?.nodes?.map(child => {
                    return (
                      <FundraiserCard key={child.id} account={child} collectiveSlug={router.query.collectiveSlug} />
                    );
                  })}
                </div>
              </React.Fragment>
            )}
            {data?.events?.totalCount > 0 && (
              <React.Fragment>
                <h3 className="text-2xl leading-none font-semibold tracking-tight">Events</h3>
                <div className="grid grid-cols-3 gap-4">
                  {data?.events?.nodes?.map(child => {
                    return (
                      <FundraiserCard key={child.id} account={child} collectiveSlug={router.query.collectiveSlug} />
                    );
                  })}
                </div>
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}

const PatternBg = () => (
  <svg id="patternId" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="a" patternUnits="userSpaceOnUse" width="36" height="36" patternTransform="scale(2) rotate(0)">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="hsla(243.74999999999997, 64.00000000000001%, 90.19607843137256%, 1)"
        />
        <path
          d="M3.445 3.624a5 5 0 01-6.89 0m8.973 4.709a10 10 0 01-11.056 0m2.083 24.043a5 5 0 016.89 0m-8.973-4.709a10 10 0 0111.056 0M39.444 3.624a5 5 0 01-6.889 0m8.973 4.709a10 10 0 01-11.056 0m2.082 24.043a5 5 0 016.891 0m-8.973-4.709a10 10 0 0111.056 0m-20.082-6.043a5 5 0 01-6.891 0m0-7.247a5 5 0 016.89 0m2.083 11.956a10 10 0 01-11.056.001m0-16.666a10 10 0 0111.056-.001"
          strokeLinecap="square"
          strokeWidth="1"
          stroke="hsla(244, 68.00000000000001%, 56.99999999999999%, 0.58)"
          fill="none"
        />
        <path
          d="M21.624-3.445a5 5 0 010 6.89m-7.247 0a5 5 0 010-6.89m11.956-2.083a10 10 0 01.001 11.056m-16.666 0a10 10 0 01-.002-11.056m11.958 38.083a5 5 0 010 6.89m-7.247 0a5 5 0 01-.001-6.89m11.956-2.083a10 10 0 01.002 11.056m-16.666 0a10 10 0 01-.002-11.056M3.624 14.555a5 5 0 010 6.891m4.71-8.974a10 10 0 01-.001 11.056m24.042-2.082a5 5 0 01.001-6.891m-4.71 8.974a10 10 0 010-11.056"
          strokeLinecap="square"
          strokeWidth="1"
          stroke="hsla(244, 68.00000000000001%, 56.99999999999999%, 0.45)"
          fill="none"
        />
      </pattern>
    </defs>
    <rect width="800%" height="800%" transform="translate(0,0)" fill="url(#a)" />
  </svg>
);
