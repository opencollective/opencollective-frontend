import React from 'react';
import { FlaskConical, Globe2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { DashboardContext } from './DashboardContext';
import type { MenuItem } from './getMenuItems';
import { MenuLink } from './MenuLink';

export type MenuSections =
  | MenuItem[]
  | {
      main: MenuItem[];
      tools?: MenuItem[];
    };

const normalizeMenuItems = (items: MenuSections): { main: MenuItem[]; tools?: MenuItem[] } => {
  if (Array.isArray(items)) {
    return { main: items };
  }

  return {
    main: items?.main || [],
    tools: items?.tools?.length ? items.tools : undefined,
  };
};

const Menu = ({ onRoute, menuItems }: { onRoute?: (...args: unknown[]) => void; menuItems: MenuSections }) => {
  const router = useRouter();
  const intl = useIntl();
  const { account } = React.useContext(DashboardContext);
  const { LoggedInUser } = useLoggedInUser();
  const { main: mainMenuItems, tools: toolMenuItems } = React.useMemo(() => normalizeMenuItems(menuItems), [menuItems]);

  React.useEffect(() => {
    if (onRoute) {
      router.events.on('routeChangeStart', onRoute);
    }
    return () => {
      if (onRoute) {
        router.events.off('routeChangeStart', onRoute);
      }
    };
  }, [router, onRoute]);

  const showLinkToProfilePrototype =
    !['ROOT', 'ORGANIZATION', 'FUND', 'INDIVIDUAL'].includes(account.type) &&
    LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.CROWDFUNDING_REDESIGN);

  return (
    <div className="space-y-6">
      {account.type !== 'ROOT' && (
        <div className="flex flex-col gap-2">
          <MenuLink
            href={getCollectivePageRoute(account)}
            Icon={Globe2}
            label={intl.formatMessage({ id: 'PublicProfile', defaultMessage: 'Public profile' })}
            className="hover:bg-slate-50 hover:text-slate-700"
            dataCy="public-profile-link"
            external
          />
          {showLinkToProfilePrototype && (
            <MenuLink
              href={`/preview/${account.slug}`}
              Icon={FlaskConical}
              label={intl.formatMessage({ defaultMessage: 'Preview new profile page', id: 'ob6Sw2' })}
              className="hover:bg-slate-50 hover:text-slate-700"
              external
            />
          )}
        </div>
      )}
      <div className="space-y-2">
        {mainMenuItems.map(item => {
          const key = item.type === 'group' ? item.label : item.section;
          return <MenuLink key={key} {...item} />;
        })}
      </div>
      {toolMenuItems && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tools</p>
          {toolMenuItems.map(item => {
            const key = item.type === 'group' ? item.label : item.section;
            return <MenuLink key={key} {...item} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Menu;
