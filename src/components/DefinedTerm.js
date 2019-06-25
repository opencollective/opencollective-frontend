import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import styled from 'styled-components';

import { textTransform } from '../lib/styled_system_custom';
import withIntl from '../lib/withIntl';
import StyledTooltip from './StyledTooltip';

/**
 * All the terms defined here must have a matching translation
 * in both `TranslatedTerms` and `TranslatedDefinitions`.
 */
export const Terms = {
  FISCAL_HOST: 'FISCAL_HOST',
  GIFT_CARD: 'GIFT_CARD',
};

const TranslatedTerms = defineMessages({
  [Terms.FISCAL_HOST]: {
    id: 'Fiscalhost',
    defaultMessage: 'Fiscal Host',
  },
  [Terms.GIFT_CARD]: {
    id: 'GiftCard',
    defaultMessage: 'Gift card',
  },
});

const TranslatedDefinitions = defineMessages({
  [Terms.FISCAL_HOST]: {
    id: 'Fiscalhost.definition',
    defaultMessage:
      'A fiscal host is a legal entity holding the money and responsible for the admin/taxes forms for the collective.',
  },
  [Terms.GIFT_CARD]: {
    id: 'GiftCard.definition',
    defaultMessage:
      'Gift cards empower your employees or community members to support the open source projects they love.',
  },
});

const UnderlinedTerm = styled.span`
  color: #969ba3;
  border-bottom: 2px dotted #969ba3;
  padding-bottom: 0.1em;
  cursor: help;
  ${textTransform}
`;

/**
 * Underlines the given word and show a tooltip with the definition when focused
 * or hovered. Both the term and the definition are translated.
 */
const DefinedTerm = ({ intl, term, termTextTransform }) => {
  return (
    <StyledTooltip content={() => intl.formatMessage(TranslatedDefinitions[term])}>
      <UnderlinedTerm textTransform={termTextTransform}>{intl.formatMessage(TranslatedTerms[term])}</UnderlinedTerm>
    </StyledTooltip>
  );
};

DefinedTerm.propTypes = {
  /** The term to be defined */
  term: PropTypes.oneOf(Object.values(Terms)),
  /** Applies to the underlined term */
  termTextTransform: PropTypes.string,
  /** @ignore from withIntl */
  intl: PropTypes.object.isRequired,
};

export default withIntl(DefinedTerm);
