import React from 'react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';
import type { Account, Host } from '../../lib/graphql/types/v2/graphql';

import ApplyToHostModal from '../ApplyToHostModal';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

const StyledCollectiveCardWrapper = styled(StyledCollectiveCard)`
  &:hover {
    border-color: #1869f5;
  }
`;

export default function ApplyToHostCard(props: {
  host: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>;
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  const [showApplyToHostModal, setShowApplyToHostModal] = React.useState(false);
  const router = useRouter();

  return (
    <React.Fragment>
      {/* @ts-expect-error StyledCollectiveCard is not typed */}
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
                values={{
                  hostedCollectives: props.host.totalHostedCollectives,
                  b: chunks => <strong>{chunks}</strong>,
                }}
              />
            </P>
            <P mt={2}>
              <FormattedMessage
                defaultMessage="<b>{ currencyCode  }</b> Currency"
                values={{
                  currencyCode: props.host.currency.toUpperCase(),
                  b: chunks => <strong>{chunks}</strong>,
                }}
              />
            </P>
            {props.host.hostFeePercent !== null && (
              <P mt={2}>
                <FormattedMessage
                  defaultMessage="<b>{ hostFeePercent }%</b> Host fee"
                  values={{
                    hostFeePercent: props.host.hostFeePercent,
                    b: chunks => <strong>{chunks}</strong>,
                  }}
                />
              </P>
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
              props.onHostApplyClick(props.host);
              setShowApplyToHostModal(true);
            }}
            buttonStyle="primary"
            width="100%"
            textTransform="capitalize"
          >
            <FormattedMessage defaultMessage="Learn more" />
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
              .push(`${props.collective.slug}/accept-financial-contributions/host/success`)
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
