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
      'A fiscal host is a legal entity holding the money and responsible for the admin/taxes forms for the collective.',
  },
  [Terms.HOST_FEE]: {
    id: 'host.hostFee.help',
    defaultMessage:
      'The host fee is the fee that the host charges your collective to take care of paying out the expenses that have been approved and to take care of recording all transactions in their books to comply with local fiscal authorities.',
  },
  [Terms.PLATFORM_FEE]: {
    id: 'host.platformFee.help',
    defaultMessage:
      'The platform fee is the fee that the Open Collective platform charges your collective on incoming contributions.',
  },
  [Terms.GIFT_CARD]: {
    id: 'GiftCard.definition',
    defaultMessage:
      'Gift cards empower your employees or community members to support the projects they love. Learn more about them <learn-more-link>here</learn-more-link>.',
  },
  [Terms.ESTIMATED_BUDGET]: {
    id: 'CollectivePage.SectionBudget.Annual.Definition',
    defaultMessage: 'Projected annual budget based on total financial contributions from the past 12 months.',
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
