import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { borderColor, color, typography } from 'styled-system';

import { textTransform } from '../lib/styled-system-custom-properties';

import Link from './Link';
import StyledTooltip from './StyledTooltip';

/**
 * All the terms defined here must have a matching translation
 * in both `TranslatedTerms` and `TranslatedDefinitions`.
 */
export const Terms = {
  FISCAL_HOST: 'FISCAL_HOST',
  GIFT_CARD: 'GIFT_CARD',
  HOST_FEE: 'HOST_FEE',
  ESTIMATED_BUDGET: 'ESTIMATED_BUDGET',
  EXPENSE_TYPE: 'EXPENSE_TYPE',
};

const TranslatedTerms = defineMessages({
  [Terms.FISCAL_HOST]: {
    id: 'Fiscalhost',
    defaultMessage: 'Fiscal Host',
  },
  [Terms.HOST_FEE]: {
    id: 'HostFee',
    defaultMessage: 'Host fee',
  },
  [Terms.PLATFORM_FEE]: {
    id: 'PlatformFee',
    defaultMessage: 'Platform fee',
  },
  [Terms.GIFT_CARD]: {
    id: 'GiftCard',
    defaultMessage: 'Gift card',
  },
  [Terms.ESTIMATED_BUDGET]: {
    id: 'CollectivePage.SectionBudget.Annual',
    defaultMessage: 'Estimated annual budget',
  },
  [Terms.EXPENSE_TYPE]: {
    id: 'expense.type',
    defaultMessage: 'Type',
  },
});

const TranslatedDefinitions = defineMessages({
  [Terms.FISCAL_HOST]: {
    id: 'Fiscalhost.definition',
    defaultMessage:
      'A Fiscal Host is an entity that holds the money on behalf of a Collective, and taxes care of accounting, taxes, and invoices.',
  },
  [Terms.HOST_FEE]: {
    id: 'host.hostFee.help',
    defaultMessage:
      'The Host Fee is what a Fiscal Host charges a Collective for its services, such as holding funds, making expense payouts, meeting tax obligations, and access to the Open Collective software platform.',
  },
  [Terms.PLATFORM_FEE]: {
    id: 'host.platformFee.help',
    defaultMessage: 'The Platform fee is what Open Collective charges for use of the software.',
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
});

const GiftCardLearnMoreLink = msg => (
  <Link route="marketing" params={{ pageSlug: 'gift-cards' }}>
    {msg}
  </Link>
);

const TranslationParams = {
  [Terms.GIFT_CARD]: {
    'learn-more-link': GiftCardLearnMoreLink,
  },
};

const UnderlinedTerm = styled.span`
  border-bottom: 2px dotted;
  cursor: help;

  ${color}
  ${borderColor}
  ${typography}
  ${textTransform}

  &:hover {
    color: ${themeGet('colors.primary.400')};
    border-color: ${themeGet('colors.primary.400')};
  }
`;

/**
 * Underlines the given word and show a tooltip with the definition when focused
 * or hovered. Both the term and the definition are translated.
 */
const DefinedTerm = ({ intl, term, textTransform, fontSize, children, color, extraTooltipContent }) => {
  return (
    <StyledTooltip
      content={() => (
        <React.Fragment>
          {intl.formatMessage(TranslatedDefinitions[term], TranslationParams[term])}
          {extraTooltipContent}
        </React.Fragment>
      )}
    >
      {props => (
        <UnderlinedTerm {...props} textTransform={textTransform} color={color} borderColor={color} fontSize={fontSize}>
          {children || intl.formatMessage(TranslatedTerms[term])}
        </UnderlinedTerm>
      )}
    </StyledTooltip>
  );
};

DefinedTerm.propTypes = {
  /** The term to be defined */
  term: PropTypes.oneOf(Object.values(Terms)),
  /** Applies to the underlined term */
  textTransform: PropTypes.string,
  /** Color for the text and the underline */
  color: PropTypes.string,
  /** Font size */
  fontSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** If provided, will be rendered in place of the term */
  children: PropTypes.node,
  /** @ignore from injectIntl */
  intl: PropTypes.object.isRequired,
  /** Extra content to include with term definition */
  extraTooltipContent: PropTypes.node,
};

DefinedTerm.defaultProps = {
  color: 'black.500',
};

export default injectIntl(DefinedTerm);
