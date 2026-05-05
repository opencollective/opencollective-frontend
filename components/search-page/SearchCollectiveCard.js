import React from 'react';
import { Info } from 'lucide-react';
import { FormattedMessage } from 'react-intl';;

import { CollectiveType } from '../../lib/constants/collectives';

import Container from '../Container';
import Currency from '../Currency';
import { Box } from '../Grid';
import { Span } from '../Text';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

import StyledCollectiveCard from './StyledCollectiveCard';
import injectIntl from '../../lib/withIntl';

/**
 * A card to show a collective on the search page.
 */
const SearchCollectiveCard = ({ collective, ...props }) => {
  return (
    <StyledCollectiveCard collective={collective} position="relative" {...props} data-cy="collective-card">
      <Container p={3}>
        <Box data-cy="caption" mb={2}>
          {collective.isHost && collective.host ? (
            <React.Fragment>
              {collective.host?.totalHostedCollectives > 0 && (
                <Box pb="6px">
                  <Span fontSize="14px" fontWeight={700} color="black.900">
                    {collective.host.totalHostedCollectives}
                  </Span>
                  {` `}
                  <Span fontSize="12px" fontWeight={400} color="black.700">
                    <FormattedMessage
                      defaultMessage="{ count, plural, one {Collective} other {Collectives}} hosted"
                      id="X8Pa2K"
                      values={{ count: collective.host.totalHostedCollectives }}
                    />
                  </Span>
                </Box>
              )}
              <Box pb="6px">
                <Span fontSize="14px" fontWeight={700} color="black.900">
                  {collective.currency}
                </Span>
                {` `}
                <Span fontSize="12px" fontWeight={400} color="black.700">
                  <FormattedMessage id="Currency" defaultMessage="Currency" />
                </Span>
              </Box>
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <span>
                  <Span fontSize="14px" fontWeight={700} color="black.900">{`${collective.host.hostFeePercent}%`}</Span>
                  {` `}
                  <Span fontSize="12px" fontWeight={400}>
                    <FormattedMessage defaultMessage="Host Fee" id="NJsELs" />
                  </Span>
                </span>
                {collective.host.platformContributionAvailable && (
                  <div className="flex items-center gap-1">
                    +{' '}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mt-1 inline-flex cursor-help items-center gap-1 underline decoration-slate-300 decoration-dashed underline-offset-2 transition-colors hover:decoration-slate-400">
                          <FormattedMessage defaultMessage="Platform Tips" id="ApplyToHostCard.platformTips" />
                          <Info size={12} className="shrink-0 text-slate-500" aria-hidden />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <FormattedMessage
                          defaultMessage="Contributors to Collectives hosted by this Fiscal Host are invited to add an optional tip to the Open Collective platform during checkout. The default tip is <b>15%</b> of the contribution amount; on average, contributors give about <b>6%</b>. <LearnMoreLink>Learn more ↗</LearnMoreLink>"
                          id="ApplyToHostCard.platformTips.tooltip"
                          values={{
                            b: chunks => <strong>{chunks}</strong>,
                            LearnMoreLink: chunks => (
                              <a
                                href="https://documentation.opencollective.com/giving-to-collectives/platform-tips"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                {chunks}
                              </a>
                            ),
                          }}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Container fontSize="12px" lineHeight="18px">
                {collective.stats?.contributorsCount > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      {collective.stats.contributorsCount}
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage
                        defaultMessage="Financial {count, plural, one {Contributor} other {Contributors}}"
                        id="MspQpE"
                        values={{ count: collective.stats.contributorsCount }}
                      />
                    </Span>
                  </Box>
                )}
              </Container>

              {collective.type !== CollectiveType.ORGANIZATION &&
                collective.stats.totalAmountReceived.valueInCents > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      <Currency
                        currency={collective.stats.totalAmountReceived.currency}
                        formatWithSeparators
                        value={collective.stats.totalAmountReceived.valueInCents}
                      />
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage defaultMessage="Money raised" id="ooRGC9" />
                    </Span>
                  </Box>
                )}

              {collective.type === CollectiveType.ORGANIZATION &&
                Math.abs(collective.stats.totalAmountSpent.valueInCents) > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      <Currency
                        currency={collective.stats.totalAmountSpent.currency}
                        formatWithSeparators
                        value={Math.abs(collective.stats.totalAmountSpent.valueInCents)}
                      />
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage id="AmountContributed" defaultMessage="Contributed" />
                    </Span>
                  </Box>
                )}
            </React.Fragment>
          )}
          {collective.description && (
            <div className="text-xs">
              <div className="mt-2 mb-1 flex items-center justify-between gap-2">
                <span className="font-medium text-slate-700 uppercase">
                  <FormattedMessage defaultMessage="About Us" id="ZjDH42" />
                </span>
                <hr className="flex-1" />
              </div>
              <span className="line-clamp-2 text-slate-800">{collective.description}</span>
            </div>
          )}
        </Box>
      </Container>
    </StyledCollectiveCard>
  );
};

export default injectIntl(SearchCollectiveCard);
