import React from 'react';
import { get } from 'lodash-es';
import type { NextRouter } from 'next/router';
import { withRouter } from 'next/router';

import { CollectiveType } from '../../lib/constants/collectives';
import type { formatCurrency } from '../../lib/currency-utils';
import type { GraphQLV1Collective } from '../../lib/custom_typings/GraphQLV1';
import type { AccountType, CollectiveFeatureStatus, ConnectedAccount } from '../../lib/graphql/types/v2/graphql';

import { ALL_SECTIONS } from '../dashboard/constants';
import ActivityLog from '../dashboard/sections/ActivityLog';
import AuthorizedApps from '../dashboard/sections/AuthorizedApps';
import ForDevelopers from '../dashboard/sections/ForDevelopers';

// Actions
import Archive from './actions/Archive';
import Delete from './actions/Delete';
import EmptyBalance from './actions/EmptyBalance';
// Sections
import CollectiveGoals from './sections/CollectiveGoals';
import CustomMessage from './sections/CustomMessage';
import EditCollectivePage from './sections/EditCollectivePage';
import Export from './sections/Export';
import FiscalHost from './sections/FiscalHost';
import FiscalHosting from './sections/FiscalHosting';
import Host from './sections/Host';
import HostVirtualCardsSettings from './sections/HostVirtualCardsSettings';
import Info from './sections/Info';
import PaymentInformation from './sections/payment-info';
import PaymentReceipts from './sections/PaymentReceipts';
import Policies from './sections/Policies';
import ReceivingMoney from './sections/ReceivingMoney';
import Security from './sections/Security';
import SendingMoney from './sections/SendingMoney';
import Tickets from './sections/Tickets';
import Tiers from './sections/Tiers';
import UserSecurity from './sections/UserSecurity';
import Webhooks from './sections/Webhooks';
import { ConvertToCollective } from './ConvertToCollective';
import { ConvertToOrganization } from './ConvertToOrganization';
// Other Components
import EditUserEmailForm from './EditUserEmailForm';

const { COLLECTIVE, FUND, PROJECT, EVENT, ORGANIZATION, USER } = CollectiveType;

type EditCollectiveFormProps = {
  collective?: {
    id: number;
    slug: string;
    name: string;
    legalName: string;
    imageUrl: string;
    policies: GraphQLV1Collective['policies'];
    type: GraphQLV1Collective['type'];
    currency?: string;
    isPrivate: boolean;
    isHost?: boolean;
    settings?: Record<string, unknown>;
    features?: Record<string, CollectiveFeatureStatus>;
    connectedAccounts?: Array<{ service: string }>;
    [key: string]: unknown;
  };
  account?: { id: string; slug: string };
  section?: string;
  host?: unknown;
  status?: string;
  onSubmit?: (collective: { id: number; HostCollectiveId?: number }) => Promise<void>;
  LoggedInUser: object;
  router: NextRouter;
};

class EditCollectiveForm extends React.Component<EditCollectiveFormProps> {
  constructor(props: EditCollectiveFormProps) {
    super(props);
  }

  renderSection(section) {
    const { collective, LoggedInUser } = this.props;

    switch (section) {
      case ALL_SECTIONS.INFO:
        return <Info account={this.props.account} />;

      case ALL_SECTIONS.COLLECTIVE_GOALS:
        return <CollectiveGoals collective={collective} currency={collective.currency} />;

      case ALL_SECTIONS.COLLECTIVE_PAGE:
        return <EditCollectivePage collective={collective} />;

      case ALL_SECTIONS.WIDGETS:
        return <Export collective={collective} />;

      case ALL_SECTIONS.HOST:
        return (
          <Host collective={collective} LoggedInUser={LoggedInUser} editCollectiveMutation={this.props.onSubmit} />
        );

      case ALL_SECTIONS.PAYMENT_METHODS:
        return <PaymentInformation account={{ ...collective, type: collective.type as AccountType }} />;

      case ALL_SECTIONS.TIERS:
        return <Tiers collective={collective} />;

      case ALL_SECTIONS.TICKETS:
        return <Tickets collective={collective} />;

      case ALL_SECTIONS.WEBHOOKS:
        return <Webhooks collectiveSlug={collective.slug} />;

      case ALL_SECTIONS.AUTHORIZED_APPS:
        return <AuthorizedApps />;

      case ALL_SECTIONS.FOR_DEVELOPERS:
        return <ForDevelopers account={collective} />;

      case ALL_SECTIONS.ACTIVITY_LOG:
        return <ActivityLog accountSlug={collective.slug} />;

      case ALL_SECTIONS.ADVANCED:
        return (
          <div>
            {collective.type === USER && <EditUserEmailForm />}
            {collective.type === ORGANIZATION && <FiscalHosting collective={collective} account={this.props.account} />}
            {[COLLECTIVE, FUND, PROJECT, EVENT].some(type => type === collective.type) && (
              <EmptyBalance collective={collective} LoggedInUser={LoggedInUser} />
            )}
            <Archive collective={collective} />
            {!collective.isPrivate && collective.type === COLLECTIVE && (
              <ConvertToOrganization collective={collective} />
            )}
            {!collective.isPrivate && collective.type === ORGANIZATION && (
              <ConvertToCollective collective={collective} />
            )}
            <Delete collective={collective} />
          </div>
        );

      // Fiscal Hosts

      case ALL_SECTIONS.FISCAL_HOSTING:
        return <FiscalHost account={this.props.account} />;

      case ALL_SECTIONS.RECEIVING_MONEY:
        return (
          <ReceivingMoney
            collective={{
              ...collective,
              type: collective.type as AccountType,
              isHost: Boolean(collective.isHost),
              currency: collective.currency as Parameters<typeof formatCurrency>[1],
              features: collective.features as Record<string, CollectiveFeatureStatus>,
              connectedAccounts: collective.connectedAccounts as Array<{ service: ConnectedAccount['service'] }>,
            }}
          />
        );

      case ALL_SECTIONS.SENDING_MONEY:
        return <SendingMoney collective={collective} />;

      case ALL_SECTIONS.SECURITY:
        return <Security collective={collective} />;

      // 2FA
      case ALL_SECTIONS.USER_SECURITY:
        return <UserSecurity slug={collective.slug} />;

      // Payment Receipts
      case ALL_SECTIONS.PAYMENT_RECEIPTS:
        return <PaymentReceipts collective={collective} />;

      // Policies and moderation
      case ALL_SECTIONS.POLICIES:
        return <Policies collective={collective} />;

      // Policies and moderation
      case ALL_SECTIONS.CUSTOM_EMAIL:
        return <CustomMessage collective={collective} />;

      case ALL_SECTIONS.HOST_VIRTUAL_CARDS_SETTINGS:
        return <HostVirtualCardsSettings collective={collective} />;

      default:
        return null;
    }
  }

  render() {
    const { router } = this.props;
    const section = this.props.section || get(router, 'query.section', 'info');

    return <div className="flex flex-grow flex-col">{this.renderSection(section)}</div>;
  }
}

/** @type {any} */
export default withRouter(EditCollectiveForm);
