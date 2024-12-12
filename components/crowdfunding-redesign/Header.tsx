import React, { useState } from 'react';
import clsx from 'clsx';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';

import Avatar from '../Avatar';
import Link from '../Link';

import { Breadcrumb } from './Breadcrumb';
import { ProfileActionButtons } from './ProfileActionButtons';
import SocialLinks from './SocialLinks';
import { TabsList, TabsTrigger } from './Tabs';

export function Header({ collective, profile, collapsed = false, activeTab, breadcrumbs }) {
  const hasSocialLinks = collective?.socialLinks && collective.socialLinks.length > 0;
  const { scrollY } = useScroll();
  const [scrolledHeader, setScrolledHeader] = useState(false);

  useMotionValueEvent(scrollY, 'change', latest => {
    if (latest > 400) {
      setScrolledHeader(true);
    } else {
      setScrolledHeader(false);
    }
  });

  return (
    <React.Fragment>
      <div className={clsx('relative w-full bg-primary/20 transition-transform', collapsed ? 'h-0' : 'h-80')}>
        {profile?.cover?.url && <img src={profile?.cover.url} alt="" className="h-full w-full object-cover" />}
      </div>
      {!collapsed && (
        <div className="relative bg-background pb-6">
          <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-center gap-2">
            <div className="z-10 -mt-16 mb-2">
              <Avatar className="border-8 border-white bg-white shadow-sm" collective={collective} radius={128} />
            </div>
            <div className="space-y-3 text-center">
              <h1 className="text-balance text-3xl font-semibold">{profile?.name}</h1>
              <p className="max-w-prose text-balance text-sm leading-normal">{profile?.description}</p>
              {hasSocialLinks && <SocialLinks socialLinks={collective.socialLinks} />}
            </div>
          </div>
          <div className="absolute right-4 top-4">
            <ProfileActionButtons />
          </div>
        </div>
      )}
      <header className="sticky top-0 z-[1000] flex h-16 border-b bg-white backdrop-blur-md">
        <div
          className={clsx(
            'w-full items-center gap-4 px-6',
            collapsed ? 'flex justify-center' : 'grid grid-cols-[minmax(auto,_1fr)_1fr_minmax(auto,_1fr)]',
          )}
        >
          <motion.div
            variants={{
              visible: { y: 0, opacity: 1 },
              hidden: {
                opacity: 0,
                y: '-300%',
              },
            }}
            animate={scrolledHeader || collapsed ? 'visible' : 'hidden'}
            transition={{ duration: 0.1, ease: 'easeInOut' }}
            className=""
          >
            <Link href={`/preview/${collective?.slug}`}>
              <Avatar collective={collective} radius={32} className="border-2 border-white bg-white shadow-sm" />
            </Link>
          </motion.div>
          {collapsed ? (
            <div className="flex flex-1 justify-start">
              <Breadcrumb breadcrumbs={breadcrumbs} />
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-1 shrink-0 flex-col items-center justify-end">
              <nav className="sticky top-0 flex space-x-4 text-sm font-medium text-muted-foreground">
                <div className="">
                  <div className="relative mx-auto -mb-px h-16 max-w-screen-xl px-6">
                    <TabsList centered={true}>
                      <TabsTrigger
                        // scroll={false}
                        href={`/preview/${collective?.slug}`}
                        active={activeTab === 'home'}
                      >
                        Fundraising
                      </TabsTrigger>
                      <TabsTrigger
                        // scroll={false}
                        href={`/preview/${collective?.slug}/finances`}
                        active={activeTab === 'finances'}
                      >
                        Finances
                      </TabsTrigger>
                      <TabsTrigger
                        href={`/preview/${collective?.slug}/updates`}
                        count={collective?.updates?.totalCount}
                        active={activeTab === 'updates'}
                      >
                        Updates
                      </TabsTrigger>
                      {/* <TabsTrigger href={`/preview/${collective?.slug}/about`} active={activeTab === 'about'}>
                        About
                      </TabsTrigger> */}
                    </TabsList>
                  </div>
                </div>
              </nav>
            </div>
          )}

          <motion.div
            variants={{
              visible: { y: 0, opacity: 1 },
              hidden: {
                opacity: 0,
                y: '-300%',
              },
            }}
            animate={scrolledHeader ? 'visible' : 'hidden'}
            transition={{ duration: 0.1, ease: 'easeInOut' }}
            className="flex justify-end"
          >
            <ProfileActionButtons />
          </motion.div>
        </div>
      </header>
    </React.Fragment>
  );
}
