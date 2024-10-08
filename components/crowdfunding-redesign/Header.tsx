import { motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { TabsList, TabsTrigger } from './DumbTabs';
import clsx from 'clsx';
import Avatar from '../Avatar';
import SocialLinks from './SocialLinks';
import { triggerPrototypeToast } from './helpers';
import { FormattedMessage } from 'react-intl';
import { Button } from '../ui/Button';
import { MoreHorizontal, Share } from 'lucide-react';
import Link from '../Link';
import { ProfileActionButtons } from './ProfileActionButtons';
import { Breadcrumb } from './Breadcrumb';

const clamp = (number, min, max) => Math.min(Math.max(number, min), max);

function useBoundedScroll(bounds) {
  const { scrollY } = useScroll();
  const scrollYBounded = useMotionValue(0);
  const scrollYBoundedProgress = useTransform(scrollYBounded, [0, bounds], [0, 1]);

  useEffect(() => {
    return scrollY.onChange(current => {
      const previous = scrollY.getPrevious();
      const diff = current - previous;
      const newScrollYBounded = scrollYBounded.get() + diff;
      scrollYBounded.set(clamp(newScrollYBounded, 0, bounds));
    });
  }, [bounds, scrollY, scrollYBounded]);
  return { scrollYBounded, scrollYBoundedProgress };
}

export function Header({ collective, account, profile, collapsed = false, activeTab, breadcrumbs }) {
  // const { scrollYBoundedProgress, scrollYBounded } = useBoundedScroll(600);
  const hasSocialLinks = collective?.socialLinks && collective.socialLinks.length > 0;
  // const height = useTransform(scrollY, value => Math.max(50 - value, 80));
  const { scrollY } = useScroll();
  const [scrolledHeader, setScrolledHeader] = useState(false);
  useMotionValueEvent(scrollY, 'change', latest => {
    if (latest > 400) {
      setScrolledHeader(true);
    } else {
      setScrolledHeader(false);
    }
  });
  // const collapsedHeader = useTransform(scrollY, value => value > 600);
  // useEffect(() => {
  //   return scrollYBounded.onChange(current => {
  //     console.log(current);
  //   });
  // });
  // console.log({ collapsedHeader });
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
              <p className="text-sm">{profile?.description}</p>
              {hasSocialLinks && <SocialLinks socialLinks={collective.socialLinks} />}
            </div>
          </div>
          <div className="absolute right-4 top-4">
            <ProfileActionButtons collective={collective} account={account} />
          </div>
        </div>
      )}
      <motion.header
        // style={{
        //   height: useTransform(scrollYBounded, [0, 536], [600, 64]),
        //   backgroundColor: useMotionTemplate`rgb(255 255 255 / ${useTransform(scrollYBoundedProgress, [0, 1], [1, 0.1])})`,
        // }}
        className="sticky top-0 z-[1000] flex h-16 border-b bg-white backdrop-blur-md"
      >
        <div className="flex w-full items-center justify-between gap-4 px-6">
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
              <motion.nav
                // style={{ opacity: useTransform(scrollYBoundedProgress, [0, 1], [1, 0]) }}
                className="sticky top-0 flex space-x-4 text-sm font-medium text-muted-foreground"
              >
                <div className="">
                  <div className="relative mx-auto -mb-px h-16 max-w-screen-xl px-6">
                    <TabsList centered={true}>
                      <TabsTrigger
                        // scroll={false}
                        href={`/preview/${collective?.slug}`}
                        data-state={activeTab === 'home' && 'active'}
                      >
                        Fundraising
                      </TabsTrigger>
                      <TabsTrigger
                        // scroll={false}
                        href={`/preview/${collective?.slug}/finances`}
                        data-state={activeTab === 'finances' && 'active'}
                      >
                        Finances
                      </TabsTrigger>
                      <TabsTrigger
                        href={`/preview/${collective?.slug}/updates`}
                        count={collective?.updates?.totalCount}
                        data-state={activeTab === 'updates' && 'active'}
                      >
                        Updates
                      </TabsTrigger>
                      <TabsTrigger
                        href={`/preview/${collective?.slug}/expenses`}
                        count={collective?.expenses?.totalCount}
                        data-state={activeTab === 'expenses' && 'active'}
                      >
                        Expenses
                      </TabsTrigger>
                      <TabsTrigger
                        href={`/preview/${collective?.slug}/about`}
                        data-state={activeTab === 'about' && 'active'}
                      >
                        About
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
              </motion.nav>
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
            className=""
          >
            <ProfileActionButtons />
          </motion.div>
        </div>
      </motion.header>
    </React.Fragment>
  );
}
