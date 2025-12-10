import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { ArrowBack } from '@styled-icons/material/ArrowBack';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import Container from '../Container';
import CreateGiftCardsForm from '../CreateGiftCardsForm';
import { ALL_SECTIONS } from '../dashboard/constants';
import ActivityLog from '../dashboard/sections/ActivityLog';
import AuthorizedApps from '../dashboard/sections/AuthorizedApps';
import ForDevelopers from '../dashboard/sections/ForDevelopers';
import { Flex } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { Button } from '../ui/Button';

// Actions
import Archive from './actions/Archive';
import Delete from './actions/Delete';
import EmptyBalance from './actions/EmptyBalance';
// Sections
import CollectiveGoals from './sections/CollectiveGoals';
import ConnectedAccounts from './sections/ConnectedAccounts';
import CustomMessage from './sections/CustomMessage';
import EditCollectivePage from './sections/EditCollectivePage';
import Export from './sections/Export';
import FiscalHost from './sections/FiscalHost';
import FiscalHosting from './sections/FiscalHosting';
import GiftCards from './sections/GiftCards';
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

class EditCollectiveForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    section: PropTypes.string,
    onSubmit: PropTypes.func,
    LoggedInUser: PropTypes.object.isRequired,
    router: PropTypes.object, // from withRouter
  };

  constructor(props) {
    super(props);
  }

  renderSection(section) {
    const { collective, LoggedInUser } = this.props;

    switch (section) {
      case ALL_SECTIONS.INFO:
        return <Info collective={collective} account={this.props.account} />;

      case ALL_SECTIONS.COLLECTIVE_GOALS:
        return <CollectiveGoals collective={collective} currency={collective.currency} />;

      case ALL_SECTIONS.COLLECTIVE_PAGE:
        return <EditCollectivePage collective={collective} />;

      case ALL_SECTIONS.CONNECTED_ACCOUNTS:
        return <ConnectedAccounts collective={collective} connectedAccounts={collective.connectedAccounts} />;

      case ALL_SECTIONS.EXPORT:
        return <Export collective={collective} />;

      case ALL_SECTIONS.HOST:
        return (
          <Host collective={collective} LoggedInUser={LoggedInUser} editCollectiveMutation={this.props.onSubmit} />
        );

      case ALL_SECTIONS.PAYMENT_METHODS:
        return <PaymentInformation account={collective} />;

      case ALL_SECTIONS.TIERS:
        return <Tiers collective={collective} types={['TIER', 'MEMBERSHIP', 'SERVICE', 'PRODUCT', 'DONATION']} />;

      case ALL_SECTIONS.TICKETS:
        return <Tickets collective={collective} />;

      case ALL_SECTIONS.GIFT_CARDS:
        return <GiftCards collectiveId={collective.id} collectiveSlug={collective.slug} />;

      case 'gift-cards-create':
      case 'gift-cards-send':
        return (
          <Flex mt={3} flexDirection="column">
            <Container
              mb={4}
              pb={4}
              borderBottom="1px solid #E8E9EB"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
            >
              <Link href={`/dashboard/${collective.slug}/gift-cards`} data-cy="back-to-giftcards-list">
                <Button variant="outline">
                  <ArrowBack size="1em" />{' '}
                  <FormattedMessage id="giftCards.returnToEdit" defaultMessage="Back to Gift Cards list" />
                </Button>
              </Link>

              <StyledLink
                href="https://documentation.opencollective.com/giving-to-collectives/giving-as-a-company/gift-cards#faq"
                openInNewTab
              >
                <InfoCircle size="1em" />
                &nbsp;
                <FormattedMessage id="Giftcard.learnMore" defaultMessage="Learn more about Gift Cards" />
              </StyledLink>
            </Container>
            <CreateGiftCardsForm
              collectiveId={collective.id}
              collectiveSlug={collective.slug}
              collectiveSettings={collective.settings}
              currency={collective.currency}
            />
          </Flex>
        );

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
            {collective.type === ORGANIZATION && (
              <FiscalHosting collective={collective} account={this.props.account} LoggedInUser={LoggedInUser} />
            )}
            {[COLLECTIVE, FUND, PROJECT, EVENT].includes(collective.type) && (
              <EmptyBalance collective={collective} LoggedInUser={LoggedInUser} />
            )}
            <Archive collective={collective} />
            {[COLLECTIVE].includes(collective.type) && <ConvertToOrganization collective={collective} />}
            {collective.type === ORGANIZATION && <ConvertToCollective collective={collective} />}
            <Delete collective={collective} />
          </div>
        );

      // Fiscal Hosts

      case ALL_SECTIONS.FISCAL_HOSTING:
        return <FiscalHost collective={collective} account={this.props.account} />;

      case ALL_SECTIONS.RECEIVING_MONEY:
        return <ReceivingMoney collective={collective} />;

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
