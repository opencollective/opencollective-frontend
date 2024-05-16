import React, { Fragment, useRef, useState } from 'react';

import ChangelogTrigger from '../../changelog/ChangelogTrigger';

import SearchModal from '../../Search';
import SearchTrigger from '../../SearchTrigger';
import ProfileMenu from '../ProfileMenu';
import { LayoutOption, useSidebar } from '@/components/SidebarContext';

type TopBarProps = {
  account?: {
    parentCollective?: {
      name: string;
      slug: string;
    };
    parent?: {
      name: string;
      slug: string;
    };
    name: string;
    slug: string;
  };
  navTitle?: string;
  loading?: boolean;
};

const TopBar = ({ account, navTitle = '' }: TopBarProps) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const { layout } = useSidebar();
  if (layout !== LayoutOption.SPLIT_TOP_LEFT_RIGHT) {
    return null;
  }
  return (
    <div className="sticky top-0 z-[1500] h-[60px] bg-white/50 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-3 xl:px-3">
        {/* <SearchTrigger setShowSearchModal={setShowSearchModal} /> */}
        <SearchModal />

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ChangelogTrigger />
          </div>
          <ProfileMenu />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
