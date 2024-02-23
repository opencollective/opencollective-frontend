import React from 'react';
import { useQuery } from '@apollo/client';
import { get } from 'lodash';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ExternalLink,
  FlaskConical,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mailbox,
  PocketKnife,
  Settings,
  User,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { UserContextProps } from '../../lib/hooks/useLoggedInUser';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { cn } from '../../lib/utils';

import Avatar from '../Avatar';
import Link from '../Link';
import LoginBtn from '../LoginBtn';
import PreviewFeaturesModal from '../PreviewFeaturesModal';
import { Badge } from '../ui/Badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Separator } from '../ui/Separator';

import { DrawerMenu } from './DrawerMenu';
import ProfileMenuMemberships from './ProfileMenuMemberships';

const memberInvitationsCountQuery = gql`
  query MemberInvitationsCount($memberAccount: AccountReferenceInput!) {
    memberInvitations(memberAccount: $memberAccount) {
      id
    }
  }
`;

const MenuItem = ({
  Icon,
  appending,
  children,
  href,
  onClick,
  className,
  external,
}: {
  Icon: LucideIcon;
  appending?: React.ReactNode;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  external?: boolean;
}) => {
  const classes = cn(
    'group mx-2 flex h-9 items-center justify-between gap-2 rounded-md px-2 text-left text-sm hover:bg-primary-foreground',
    className,
  );
  const content = (
    <React.Fragment>
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground transition-colors group-hover:text-foreground" size={16} />
        <span className="truncate">{children}</span>
      </div>
      {appending}
    </React.Fragment>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {content}
        <ExternalLink size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
};

const ProfileMenu = ({ logoutParameters }: { logoutParameters?: Parameters<UserContextProps['logout']>[0] }) => {
  const router = useRouter();
  const { LoggedInUser, logout } = useLoggedInUser();
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [showPreviewFeaturesModal, setShowPreviewFeaturesModal] = React.useState(false);
  const hasAvailablePreviewFeatures = LoggedInUser?.getAvailablePreviewFeatures()?.length > 0;
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;
  const { data } = useQuery(memberInvitationsCountQuery, {
    variables: { memberAccount: { slug: LoggedInUser?.collective?.slug } },
    skip: !LoggedInUser,
    context: API_V2_CONTEXT,
    // We ignore errors here because the logout action can trigger refetch before LoggedInUser is set to null and we don't really care if this query fails
    errorPolicy: 'ignore',
  });

  React.useEffect(() => {
    const handler = () => setMenuOpen(false);
    router.events.on('routeChangeStart', handler);
    return () => {
      router.events.off('routeChangeStart', handler);
    };
  }, []);

  if (!LoggedInUser) {
    return <LoginBtn />;
  }

  const pendingInvitations = data?.memberInvitations?.length > 0 ? data?.memberInvitations?.length : null;

  const content = (
    <React.Fragment>
      <div className="flex flex-col sm:flex-row">
        <div className="flex flex-col sm:w-[228px]">
          <div className="flex flex-col gap-1 py-2">
            <div className="flex items-center gap-2 px-2 py-1">
              <Avatar collective={LoggedInUser.collective} radius={32} />
              <div className="truncate">
                <div className="truncate text-sm font-medium">{LoggedInUser.collective.name}</div>
                <div className="truncate text-xs text-muted-foreground">{LoggedInUser.email}</div>
              </div>
            </div>

            <Separator className="my-1" />

            <MenuItem Icon={User} href={`/${LoggedInUser.collective.slug}`}>
              <FormattedMessage id="menu.profile" defaultMessage="Profile" />
            </MenuItem>
            <MenuItem Icon={LayoutDashboard} href={`/dashboard/${LoggedInUser.collective.slug}`}>
              <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
            </MenuItem>
            {pendingInvitations && (
              <MenuItem
                Icon={Mailbox}
                href="/member-invitations"
                appending={
                  <Badge type="info" round size="sm">
                    {pendingInvitations}
                  </Badge>
                }
              >
                <FormattedMessage defaultMessage="Member Invitations" />
              </MenuItem>
            )}

            {hasAvailablePreviewFeatures && (
              <MenuItem
                Icon={FlaskConical}
                onClick={() => setShowPreviewFeaturesModal(true)}
                appending={
                  <Badge type="info" round size="sm">
                    <FormattedMessage defaultMessage="New!" />
                  </Badge>
                }
              >
                <FormattedMessage id="PreviewFeatures" defaultMessage="Preview Features" />
              </MenuItem>
            )}
            {LoggedInUser.isRoot && (
              <MenuItem Icon={PocketKnife} href="/opencollective/root-actions">
                <FormattedMessage id="RootActions" defaultMessage="Root Actions" />
              </MenuItem>
            )}
            <MenuItem Icon={Settings} href={`/dashboard/${LoggedInUser.collective.slug}/info`}>
              <FormattedMessage id="Settings" defaultMessage="Settings" />
            </MenuItem>

            <Separator className="my-1" />

            <MenuItem Icon={Home} href="/home">
              <FormattedMessage defaultMessage="Open Collective Home" />
            </MenuItem>

            <MenuItem Icon={LifeBuoy} href="/help">
              <FormattedMessage defaultMessage="Help & Support" />
            </MenuItem>

            <MenuItem Icon={BookOpen} href="https://docs.opencollective.com" external={true}>
              <FormattedMessage id="menu.documentation" defaultMessage="Documentation" />
            </MenuItem>

            <Separator className="my-1" />

            <MenuItem Icon={LogOut} onClick={() => logout(logoutParameters)} data-cy="logout">
              <FormattedMessage id="menu.logout" defaultMessage="Log out" />
            </MenuItem>
          </div>
        </div>
        <Separator className="sm:hidden" />
        <div className="flex flex-col sm:w-[256px]">
          <div className="flex-grow border-l text-sm sm:basis-0 sm:overflow-y-auto">
            <ProfileMenuMemberships user={LoggedInUser} closeDrawer={() => setMenuOpen(false)} />
          </div>
        </div>
      </div>
      <PreviewFeaturesModal open={showPreviewFeaturesModal} setOpen={setShowPreviewFeaturesModal} />
    </React.Fragment>
  );
  return (
    <React.Fragment>
      <Popover open={isMenuOpen} onOpenChange={open => setMenuOpen(open)}>
        <PopoverTrigger asChild>
          <button
            className="rounded-full ring-black ring-offset-1 focus:outline-none focus:ring-2"
            data-cy="user-menu-trigger"
          >
            <Avatar collective={get(LoggedInUser, 'collective')} radius={32} />
          </button>
        </PopoverTrigger>
        {!isMobile && (
          <PopoverContent align="end" className="w-full max-w-lg overflow-hidden rounded-xl p-0">
            {content}
          </PopoverContent>
        )}
      </Popover>
      {isMobile && (
        <DrawerMenu onClose={() => setMenuOpen(false)} open={isMenuOpen}>
          {content}
        </DrawerMenu>
      )}
    </React.Fragment>
  );
};
export default ProfileMenu;
