import React from 'react';
import { Info } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';
import type { Account, Host } from '../../lib/graphql/types/v2/graphql';

import ApplyToHostModal from '../ApplyToHostModal';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

const StyledCollectiveCardWrapper = styled(StyledCollectiveCard)`
  &:hover {
    border-color: #1869f5;
  }
`;

export default function ApplyToHostCard(props: {
  host: Pick<
    Host,
    'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent' | 'platformContributionAvailable'
  >;
  collective: Pick<Account, 'slug'>;
}) {
  const [showApplyToHostModal, setShowApplyToHostModal] = React.useState(false);
  const router = useRouter();

  return (
    <React.Fragment>
      <StyledCollectiveCardWrapper
        collective={props.host}
        minWidth={250}
        position="relative"
        width="100%"
        paddingBottom="20px !important"
        childrenContainerProps={{ height: '100%', flexGrow: 1, justifyContent: 'flex-start' }}
        bodyProps={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Box flexGrow={1}>
          <Box mx={3}>
            <P>
              <FormattedMessage
                defaultMessage="{ hostedCollectives, plural, one {<b>#</b> Collective} other {<b>#</b> Collectives} } hosted"
                id="D5tV0Y"
                values={{
                  hostedCollectives: props.host.totalHostedCollectives,
                  b: chunks => <strong>{chunks}</strong>,
                }}
              />
            </P>
            <P mt={2}>
              <FormattedMessage
                defaultMessage="<b>{ currencyCode }</b> Currency"
                id="yQt2k/"
                values={{
                  currencyCode: props.host.currency.toUpperCase(),
                  b: chunks => <strong>{chunks}</strong>,
                }}
              />
            </P>
            {(props.host.hostFeePercent !== null || props.host.platformContributionAvailable) && (
              <div className="mt-1 flex items-center gap-1.5 text-sm">
                {props.host.hostFeePercent !== null && (
                  <span>
                    <FormattedMessage
                      defaultMessage="<b>{ hostFeePercent }%</b> Host fee"
                      id="URR2Ki"
                      values={{
                        hostFeePercent: props.host.hostFeePercent,
                        b: chunks => <strong>{chunks}</strong>,
                      }}
                    />
                  </span>
                )}
                {props.host.platformContributionAvailable && (
                  <div className="flex items-center gap-1">
                    +{' '}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex cursor-help items-center gap-1 underline decoration-slate-300 decoration-dashed underline-offset-2 transition-colors hover:decoration-slate-400">
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
            )}
          </Box>
          {props.host.description !== null && props.host.description.length !== 0 && (
            <React.Fragment>
              <Flex mx={3} pt={3} alignItems="center">
                <Span
                  color="black.700"
                  fontSize="12px"
                  lineHeight="16px"
                  textTransform="uppercase"
                  fontWeight="500"
                  letterSpacing="0.06em"
                >
                  <FormattedMessage id="OurPurpose" defaultMessage="Our purpose" />
                </Span>
                <StyledHr borderColor="black.300" flex="1 1" ml={2} />
              </Flex>
              <P mx={3} mt={1} fontSize="12px" lineHeight="18px" color="black.800">
                {props.host.description}
              </P>
            </React.Fragment>
          )}
        </Box>
        <Box mx={3} mt={3}>
          <StyledButton
            onClick={() => {
              setShowApplyToHostModal(true);
            }}
            buttonStyle="primary"
            width="100%"
            textTransform="capitalize"
          >
            <FormattedMessage defaultMessage="Learn more" id="TdTXXf" />
          </StyledButton>
        </Box>
      </StyledCollectiveCardWrapper>
      {showApplyToHostModal && (
        <ApplyToHostModal
          hostSlug={props.host.slug}
          collective={props.collective}
          onClose={() => setShowApplyToHostModal(false)}
          onSuccess={() => {
            return router
              .push(`${props.collective.slug}/accept-financial-contributions/host/success?hostSlug=${props.host.slug}`)
              .then(() => window.scrollTo(0, 0))
              .then(() => {
                confettiFireworks(5000, { zIndex: 3000 });
              });
          }}
        />
      )}
    </React.Fragment>
  );
}
