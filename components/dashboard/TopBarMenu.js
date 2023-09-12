import React from 'react';
import PropTypes from 'prop-types';
import {
  ArrowLeftRight,
  BarChart3 as Chart,
  Coins,
  CreditCard,
  FileText,
  Home,
  Inbox,
  LayoutDashboard,
  Network,
  Receipt,
  Settings,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../../lib/allowed-features';
import { isHostAccount, isIndividualAccount, isInternalHost, isSelfHostedAccount } from '../../lib/collective.lib';
import { isOneOfTypes, isType } from '../../lib/collective-sections';
import { CollectiveType } from '../../lib/constants/collectives';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import Container from '../Container';
import { Flex } from '../Grid';
import {
  ABOUT_ORG_SECTIONS,
  ALL_SECTIONS,
  COLLECTIVE_SECTIONS,
  FISCAL_HOST_SECTIONS,
  HOST_DASHBOARD_SECTIONS,
  ORG_BUDGET_SECTIONS,
} from './constants';
import { DashboardContext } from './DashboardContext';
import { MenuGroup, MenuLink, MenuSectionHeader } from './TopBarMenuComponents';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

const { USER, ORGANIZATION, COLLECTIVE, FUND, EVENT, PROJECT } = CollectiveType;

const Menu = ({ isAccountantOnly, menuItems }) => {
  const { selectedSection, expandedSection, setExpandedSection, account } = React.useContext(DashboardContext);
  console.log(selectedSection);
  const isHost = isHostAccount(account);
  const isUserHost = account.isHost === true && isType(account, USER); // for legacy compatibility for users who are hosts
  const isIndividual = isIndividualAccount(account);
  const { LoggedInUser } = useLoggedInUser();
  console.log({ menuItems });

  return (
    <div className="flex gap-1.5">
      {menuItems?.map(({ label, Icon, section, sections, href, isActive }) => {
        console.log({ sections });
        return (
          <MenuLink
            key={href}
            Icon={Icon}
            href={href}
            isActive={section === selectedSection || sections?.includes(selectedSection)}
          >
            {label}
          </MenuLink>
        );
      })}
    </div>
  );
};

Menu.propTypes = {
  isAccountantOnly: PropTypes.bool,
};

export default Menu;
