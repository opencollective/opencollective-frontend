import React from 'react';
import { FormattedMessage } from 'react-intl';

import VirtualCardsSection from '../../edit-collective/sections/virtual-cards/VirtualCards';
import { getI18nLink } from '../../I18nFormatters';
import DashboardHeader from '../DashboardHeader';
import { DashboardSectionProps } from '../types';

const VitualCards = ({ accountSlug }: DashboardSectionProps) => {
  return (
    <div>
      <DashboardHeader
        title={<FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />}
        description={
          <FormattedMessage
            id="VirtualCards.Description"
            defaultMessage="Use a virtual card to spend from your collective's budget. You can request multiple cards (review the host's policy to see how many). Your fiscal host will create the card for you and assign it a limit and a merchant. You will be notified by email once the card is assigned. <learnMoreLink>Learn more</learnMoreLink>"
            values={{
              learnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/expenses-and-getting-paid/virtual-cards',
                openInNewTabNoFollow: true,
              }),
            }}
          />
        }
      />
      <VirtualCardsSection accountSlug={accountSlug} isDashboard />
    </div>
  );
};

export default VitualCards;
