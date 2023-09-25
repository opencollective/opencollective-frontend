import React from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeftRight as Transfer,
  BarChart3 as Chart,
  Coins,
  CreditCard,
  FileText,
  Globe2,
  Inbox,
  LayoutDashboard,
  Network,
  Receipt,
  Settings,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isInternalHost, isSelfHostedAccount } from '../../lib/collective.lib';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { ALL_SECTIONS } from './constants';
import { DashboardContext } from './DashboardContext';
import { MenuGroup, MenuLink, MenuSectionHeader } from './MenuComponents';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const Menu = ({ isAccountantOnly, onRoute, menuItems }) => {
  const router = useRouter();
  const { account } = React.useContext(DashboardContext);
  const isHost = isHostAccount(account);
  const isIndividual = isIndividualAccount(account);

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

  return (
    <div className="space-y-4">
      <MenuLink
        href={getCollectivePageRoute(account)}
        Icon={Globe2}
        className="hover:bg-slate-50 hover:text-slate-700"
        external
      >
        <FormattedMessage id="PublicProfile" defaultMessage="Public profile" />
      </MenuLink>
      <MenuGroup>
        {menuItems.map(({ section, Icon, label, sections, subMenu }) => {
          if (subMenu) {
            return (
              <MenuLink
                key={label}
                Icon={Icon}
                goToSection={sections[0]}
                sections={sections}
                renderSubMenu={() => (
                  <React.Fragment>
                    {subMenu.map(({ section, Icon, label }) => (
                      <MenuLink key={section} parentSection={section} section={section} Icon={Icon}>
                        {label}
                      </MenuLink>
                    ))}
                  </React.Fragment>
                )}
              >
                {label}
              </MenuLink>
            );
          }
          return (
            <MenuLink key={section} section={section} Icon={Icon}>
              {label}
            </MenuLink>
          );
        })}
      </MenuGroup>
    </div>
  );
};

Menu.propTypes = {
  isAccountantOnly: PropTypes.bool,
  onRoute: PropTypes.func,
};

export default Menu;
