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
  Settings,
  User,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { UserContextProps } from '../../lib/hooks/useLoggedInUser';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { useWindowResize, VIEWPORTS } from '../../lib/hooks/useWindowResize';
import { cn } from '../../lib/utils';
import useWhitelabelProvider from '@/lib/hooks/useWhitelabel';

import Avatar from '../Avatar';
import Link from '../Link';
import LoginBtn from '../LoginBtn';
import PreviewFeaturesModal from '../PreviewFeaturesModal';
import { Badge } from '../ui/Badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Separator } from '../ui/Separator';

import { DrawerMenu } from './DrawerMenu';
import { ProfileMenuIconsMap } from './Icons';
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
  href,
  onClick,
  className,
  external,
  label,
  ...props
}: {
  Icon: LucideIcon | string;
  appending?: React.ReactNode;
  href?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
  external?: boolean;
}) => {
  if (typeof Icon === 'string') {
    Icon = ProfileMenuIconsMap[Icon as keyof typeof ProfileMenuIconsMap];
  }
  const classes = cn(
    'group mx-2 flex h-9 items-center justify-between gap-2 overflow-hidden rounded-md px-2 text-left text-sm hover:bg-primary-foreground',
    className,
  );
  const content = (
    <React.Fragment>
      <div className="flex w-full items-center gap-2" title={label}>
        <Icon className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" size={16} />
        <div className="shrink overflow-hidden text-nowrap text-ellipsis">{label}</div>
        {appending}
      </div>
    </React.Fragment>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className={classes} {...props}>
        {content}
      </button>
    );
  }
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...props}>
        {content}
        <ExternalLink size={16} className="opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      {content}
    </Link>
  );
};

const ProfileMenu = ({ logoutParameters }: { logoutParameters?: Parameters<UserContextProps['logout']>[0] }) => {
  const whitelabel = useWhitelabelProvider();
  const router = useRouter();
  const intl = useIntl();
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
    return <LoginBtn whitelabel={whitelabel} />;
  }

  const pendingInvitations = data?.memberInvitations?.length > 0 ? data?.memberInvitations?.length : null;
  const menuLinks = whitelabel?.links?.filter(link => !!link.icon);

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
            <MenuItem
              Icon={User}
              href={`/${LoggedInUser.collective.slug}`}
              label={intl.formatMessage({ id: 'menu.profile', defaultMessage: 'Profile' })}
            />
            <MenuItem
              Icon={LayoutDashboard}
              href={`/dashboard/${LoggedInUser.collective.slug}`}
              label={intl.formatMessage({
                id: 'Dashboard',
                defaultMessage: 'Dashboard',
              })}
            />
            {pendingInvitations && (
              <MenuItem
                Icon={Mailbox}
                href="/member-invitations"
                appending={
                  <Badge type="info" round size="sm">
                    {pendingInvitations}
                  </Badge>
                }
                label={intl.formatMessage({
                  id: 'iW16Sa',
                  defaultMessage: 'Member Invitations',
                })}
              />
            )}
            {hasAvailablePreviewFeatures && (
              <MenuItem
                Icon={FlaskConical}
                onClick={() => setShowPreviewFeaturesModal(true)}
                appending={
                  <Badge type="info" round size="sm">
                    <FormattedMessage defaultMessage="New!" id="RlOKwP" />
                  </Badge>
                }
                label={intl.formatMessage({
                  id: 'PreviewFeatures',
                  defaultMessage: 'Preview Features',
                })}
              />
            )}
            <MenuItem
              Icon={Settings}
              href={`/dashboard/${LoggedInUser.collective.slug}/info`}
              label={intl.formatMessage({ id: 'Settings', defaultMessage: 'Settings' })}
            />
            <Separator className="my-1" />
            {!whitelabel ? ( // <div className="min-h-10" />
              <React.Fragment>
                <MenuItem
                  Icon={Home}
                  href="/home"
                  label={intl.formatMessage({ id: 'qFt6F7', defaultMessage: 'Open Collective Home' })}
                />
                <MenuItem
                  Icon={LifeBuoy}
                  href="/help"
                  label={intl.formatMessage({ id: 'Uf3+S6', defaultMessage: 'Help & Support' })}
                />
                <MenuItem
                  Icon={BookOpen}
                  href="https://documentation.opencollective.com"
                  external={true}
                  label={intl.formatMessage({ id: 'menu.documentation', defaultMessage: 'Documentation' })}
                />
                <Separator className="my-1" />
              </React.Fragment>
            ) : (
              menuLinks?.length > 0 && (
                <React.Fragment>
                  {menuLinks.map(({ label, href, icon }) => (
                    <MenuItem key={href} Icon={icon} href={href} label={label} external />
                  ))}
                  <Separator className="my-1" />
                </React.Fragment>
              )
            )}
            <MenuItem
              Icon={LogOut}
              onClick={() => logout(logoutParameters)}
              data-cy="logout"
              label={intl.formatMessage({ id: 'menu.logout', defaultMessage: 'Log out' })}
            />
          </div>
        </div>
        <Separator className="sm:hidden" />
        <div className="flex flex-col sm:w-[256px]">
          <div className="grow border-l text-sm sm:basis-0 sm:overflow-y-auto">
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
            className="rounded-full ring-black ring-offset-1 focus:ring-2 focus:outline-hidden"
            data-cy="user-menu-trigger"
          >
            <Avatar collective={get(LoggedInUser, 'collective')} radius={32} />
          </button>
        </PopoverTrigger>
        {!isMobile && (
          <PopoverContent data-cy="user-menu" align="end" className="w-full max-w-lg overflow-hidden rounded-xl p-0">
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
