import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { defineMessages, useIntl } from 'react-intl';
import { styled } from 'styled-components';
import type { BorderColorProps, ColorProps, TypographyProps } from 'styled-system';
import { borderColor, color, typography } from 'styled-system';

import type { TextTransformProps } from '../lib/styled-system-custom-properties';
import { textTransform } from '../lib/styled-system-custom-properties';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import Link from './Link';

/**
 * All the terms defined here must have a matching translation
 * in both `TranslatedTerms` and `TranslatedDefinitions`.
 */
export const Terms = {
  FISCAL_HOST: 'FISCAL_HOST',
  GIFT_CARD: 'GIFT_CARD',
  HOST_FEE: 'HOST_FEE',
  ADMINISTRATIVE_CONTRIBUTION: 'ADMINISTRATIVE_CONTRIBUTION',
  PLATFORM_FEE: 'PLATFORM_FEE',
  PLATFORM_TIPS: 'PLATFORM_TIPS',
  ESTIMATED_BUDGET: 'ESTIMATED_BUDGET',
  EXPENSE_TYPE: 'EXPENSE_TYPE',
  TOTAL_RAISED: 'TOTAL_RAISED',
  TOTAL_INCOME: 'TOTAL_INCOME',
  BALANCE: 'BALANCE',
} as const;

const TranslatedTerms = defineMessages({
  [Terms.FISCAL_HOST]: {
    id: 'Fiscalhost',
    defaultMessage: 'Fiscal Host',
  },
  [Terms.HOST_FEE]: {
    id: 'HostFee',
    defaultMessage: 'Host fee',
  },
  [Terms.ADMINISTRATIVE_CONTRIBUTION]: {
    id: 'AdministrativeContribution',
    defaultMessage: 'Administrative contribution',
  },
  [Terms.PLATFORM_FEE]: {
    id: 'PlatformFee',
    defaultMessage: 'Platform fee',
  },
  [Terms.PLATFORM_TIPS]: {
    id: 'ApplyToHostCard.platformTips',
    defaultMessage: 'Platform Tips',
  },
  [Terms.GIFT_CARD]: {
    id: 'GiftCard',
    defaultMessage: 'Gift Card',
  },
  [Terms.ESTIMATED_BUDGET]: {
    id: 'CollectivePage.SectionBudget.Annual',
    defaultMessage: 'Estimated annual budget',
  },
  [Terms.EXPENSE_TYPE]: {
    id: 'expense.type',
    defaultMessage: 'Type',
  },
  [Terms.TOTAL_RAISED]: {
    id: 'budgetSection-raised',
    defaultMessage: 'Total raised',
  },
  [Terms.TOTAL_INCOME]: {
    id: 'budgetSection-income',
    defaultMessage: 'Total income',
  },
  [Terms.BALANCE]: {
    id: 'CollectivePage.SectionBudget.Balance',
    defaultMessage: 'Today’s balance',
  },
});

const TranslatedDefinitions = defineMessages({
  [Terms.FISCAL_HOST]: {
    id: 'Fiscalhost.definition',
    defaultMessage:
      'A Fiscal Host is an entity that holds the money on behalf of a Collective, and takes care of accounting, taxes, and invoices.',
  },
  [Terms.HOST_FEE]: {
    id: 'host.hostFee.help',
    defaultMessage:
      'Percentage of incoming contributions that this Fiscal Host retains as an administrative contribution for hosting services, such as holding funds, processing expense payouts, and handling accounting and tax obligations. <LearnMoreLink>Learn more ↗</LearnMoreLink>',
  },
  [Terms.ADMINISTRATIVE_CONTRIBUTION]: {
    id: 'host.hostFee.help',
    defaultMessage:
      'Percentage of incoming contributions that this Fiscal Host retains as an administrative contribution for hosting services, such as holding funds, processing expense payouts, and handling accounting and tax obligations. <LearnMoreLink>Learn more ↗</LearnMoreLink>',
  },
  [Terms.PLATFORM_FEE]: {
    id: 'host.platformFee.help',
    defaultMessage: 'The Platform fee is what Open Collective charges for use of the software.',
  },
  [Terms.PLATFORM_TIPS]: {
    id: 'ApplyToHostCard.platformTips.tooltip',
    defaultMessage:
      'Contributors to Collectives hosted by this Fiscal Host are invited to add an optional tip to the Open Collective platform during checkout. The default tip is <b>15%</b> of the contribution amount; on average, contributors give about <b>6%</b>. <LearnMoreLink>Learn more ↗</LearnMoreLink>',
  },
  [Terms.GIFT_CARD]: {
    id: 'GiftCard.definition',
    defaultMessage:
      'Gift cards empower your employees or community members to support the projects they love. <learn-more-link>Learn more</learn-more-link>.',
  },
  [Terms.ESTIMATED_BUDGET]: {
    id: 'CollectivePage.SectionBudget.Annual.Definition',
    defaultMessage: 'Projected annual budget based on financial contributions over the past 12 months.',
  },
  [Terms.EXPENSE_TYPE]: {
    id: 'expense.type.tooltip',
    defaultMessage:
      "Select 'receipt' to get paid back for a purchase already made. Select 'invoice' if you are charging for your time, getting paid in advance, or do not have a receipt.",
  },
  [Terms.TOTAL_RAISED]: {
    id: 'budgetSection-raised-definition',
    defaultMessage: 'Total net amount available to spend after fees.',
  },
  [Terms.TOTAL_INCOME]: {
    id: 'budgetSection-total-income-definition',
    defaultMessage: 'Net all time, including host fees and direct contributions.',
  },
  [Terms.BALANCE]: {
    id: 'budgetSection-balance-definition',
    defaultMessage: 'The current balance of the account. Not including Projects and Events.',
  },
});

const GiftCardLearnMoreLink = msg => <Link href="/gift-cards">{msg}</Link>;

const PlatformTipsLearnMoreLink = chunks => (
  <a
    href="https://documentation.opencollective.com/giving-to-collectives/platform-tips"
    target="_blank"
    rel="noopener noreferrer"
    className="underline"
  >
    {chunks}
  </a>
);

const HostFeeLearnMoreLink = chunks => (
  <a
    href="https://documentation.opencollective.com/collectives/choosing-a-fiscal-host"
    target="_blank"
    rel="noopener noreferrer"
    className="underline"
  >
    {chunks}
  </a>
);

const TranslationParams = {
  [Terms.GIFT_CARD]: {
    'learn-more-link': GiftCardLearnMoreLink,
  },
  [Terms.PLATFORM_TIPS]: {
    b: chunks => <strong>{chunks}</strong>,
    LearnMoreLink: PlatformTipsLearnMoreLink,
  },
  [Terms.ADMINISTRATIVE_CONTRIBUTION]: {
    b: chunks => <strong>{chunks}</strong>,
    LearnMoreLink: HostFeeLearnMoreLink,
  },
  [Terms.HOST_FEE]: {
    LearnMoreLink: HostFeeLearnMoreLink,
  },
};

const UnderlinedTerm = styled.span<TextTransformProps & BorderColorProps & TypographyProps & ColorProps>`
  border-bottom: 2px dotted;
  cursor: help;

  ${color}
  ${borderColor}
  ${typography}
  ${textTransform}

  &:hover {
    color: ${themeGet('colors.primary.500')};
    border-color: ${themeGet('colors.primary.500')};
  }
`;

/**
 * Underlines the given word and show a tooltip with the definition when focused
 * or hovered. Both the term and the definition are translated.
 */
const DefinedTerm = ({
  term,
  textTransform = undefined,
  fontSize = undefined,
  children = null,
  color = 'black.700',
  borderColor = color,
  extraTooltipContent = null,
}: {
  term: keyof typeof Terms;
  textTransform?: TextTransformProps['textTransform'];
  fontSize?: TypographyProps['fontSize'];
  children?: React.ReactNode;
  color?: ColorProps['color'];
  borderColor?: BorderColorProps['borderColor'];
  extraTooltipContent?: React.ReactNode;
}) => {
  const intl = useIntl();
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <UnderlinedTerm textTransform={textTransform} color={color} borderColor={borderColor} fontSize={fontSize}>
          {children || intl.formatMessage(TranslatedTerms[term])}
        </UnderlinedTerm>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm text-left text-xs leading-snug">
        <React.Fragment>
          {intl.formatMessage(TranslatedDefinitions[term], TranslationParams[term])}
          {extraTooltipContent}
        </React.Fragment>
      </TooltipContent>
    </Tooltip>
  );
};

export default DefinedTerm;
