import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { confettiFireworks } from '../../lib/confettis';
import { Currency } from '../../lib/constants/currency';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Account, Collective, Host } from '../../lib/graphql/types/v2/graphql';

import ApplyToHostModal from '../ApplyToHostModal';
import HowToUseOpenCollective from '../fiscal-hosting/HowCanAFiscalHostHelpSection';
import { Box, Flex, Grid } from '../Grid';
import InputTypeCountry from '../InputTypeCountry';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledFilters from '../StyledFilters';
import StyledHr from '../StyledHr';
import StyledSelect from '../StyledSelect';
import { H1, P, Span } from '../Text';

export type StartAcceptingFinancialContributionsPageProps = {
  collective: Collective;
  onChange: (field: string, value: unknown) => void;
};

const HostCardContainer = styled(Grid).attrs({
  justifyItems: 'center',
  gridGap: '30px',
  gridTemplateColumns: ['repeat(auto-fill, minmax(250px, 1fr))'],
  gridAutoRows: ['1fr'],
})`
  & > * {
    padding: 0;
  }
`;

const Illustration = styled.img`
  width: 160px;
  height: 160px;
  object-fit: cover;
`;

const StyledCollectiveCardWrapper = styled(StyledCollectiveCard)`
  &:hover {
    border-color: #1869f5;
  }
`;

const CommunityTypes = ['Open Source', 'Mutual Aid', 'Climate', 'BLM', 'Indigenous', 'Education', 'Festival'];

function ApplyToHostCard(props: {
  host: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>;
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  const [showApplyToHostModal, setShowApplyToHostModal] = React.useState(false);
  const router = useRouter();

  return (
    <React.Fragment>
      {/* @ts-ignore StyledCollectiveCard is not typed */}
      <StyledCollectiveCardWrapper
        /* @ts-ignore StyledCollectiveCard is not typed */
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
          >
            <FormattedMessage id="Apply" defaultMessage="Apply" />
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

const FindAFiscalHostQuery = gql`
  query FindAFiscalHostQuery($tags: [String], $limit: Int, $country: [CountryISO], $currency: String) {
    hosts(tag: $tags, limit: $limit, tagSearchOperator: OR, country: $country, currency: $currency) {
      totalCount
      nodes {
        id
        legacyId
        createdAt
        settings
        type
        name
        slug
        description
        longDescription
        currency
        totalHostedCollectives
        hostFeePercent
        isTrustedHost
        location {
          id
          country
        }
        tags
      }
    }
  }
`;

function FeaturedFiscalHostResults({
  hosts,
  collective,
  onHostApplyClick,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  return (
    <StyledCard padding={4} bg="#F1F6FF" borderRadius="24px" borderStyle="none">
      <Flex>
        <P fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Recommended Hosts" />
        </P>
        <P ml={1} fontSize="14px" lineHeight="32px" fontWeight="400" color="black.900">
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            values={{
              hostCount: hosts.length,
            }}
          />
        </P>
      </Flex>
      <P fontSize="14px" lineHeight="24px" fontWeight="700" color="black.700" opacity={0.5}>
        <FormattedMessage defaultMessage="Our most trusted hosts" />
      </P>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return (
            <ApplyToHostCard key={host.slug} host={host} collective={collective} onHostApplyClick={onHostApplyClick} />
          );
        })}
      </HostCardContainer>
    </StyledCard>
  );
}

function OtherFiscalHostResults({
  hosts,
  totalCount,
  collective,
  onHostApplyClick,
}: {
  hosts: Pick<Host, 'slug' | 'totalHostedCollectives' | 'description' | 'currency' | 'hostFeePercent'>[];
  totalCount: number;
  collective: Pick<Account, 'slug'>;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  return (
    <Box>
      <Flex>
        <P fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Other Hosts" />
        </P>
        <P ml={1} fontSize="14px" lineHeight="32px" fontWeight="400" color="black.900">
          <FormattedMessage
            defaultMessage="{ hostCount, plural, one {# host} other {# hosts} } found"
            values={{
              hostCount: totalCount,
            }}
          />
        </P>
      </Flex>
      <HostCardContainer mt={3}>
        {hosts.map(host => {
          return (
            <ApplyToHostCard key={host.slug} host={host} collective={collective} onHostApplyClick={onHostApplyClick} />
          );
        })}
      </HostCardContainer>
    </Box>
  );
}

function useNonEmptyResultCache(data) {
  const nonEmptyResult = React.useRef(data);
  React.useEffect(() => {
    if (data && data?.hosts?.nodes?.length !== 0) {
      nonEmptyResult.current = data;
    }
  }, [data]);

  return nonEmptyResult.current;
}

function FindAHostSearch(props: {
  selectedCommunityType: string[];
  selectedCountry: string;
  selectedCurrency: string;
  collective: Account;
  onHostApplyClick: (host: Partial<Host>) => void;
}) {
  const { data, loading } = useQuery<{
    hosts: {
      totalCount: number;
      nodes: Pick<Host, 'slug' | 'currency' | 'totalHostedCollectives' | 'hostFeePercent' | 'isTrustedHost'>[];
    };
  }>(FindAFiscalHostQuery, {
    variables: {
      tags: props.selectedCommunityType.length !== 0 ? props.selectedCommunityType : undefined,
      country: props.selectedCountry !== 'ALL' ? [props.selectedCountry] : null,
      currency: props.selectedCurrency !== 'ANY' ? props.selectedCurrency : null,
      limit: 50,
    },
    context: API_V2_CONTEXT,
  });

  const cachedNonEmptyResult = useNonEmptyResultCache(data);

  if (loading) {
    return (
      <Box mt={2}>
        <P fontSize="24px" lineHeight="32px" fontWeight="700" color="black.900">
          <FormattedMessage defaultMessage="Finding the right host for you..." />
        </P>
        <Loading />
      </Box>
    );
  }

  const isEmpty = data?.hosts?.nodes?.length === 0;
  const displayData = isEmpty ? cachedNonEmptyResult : data;

  const hosts = displayData?.hosts?.nodes || [];

  const featuredHosts = hosts.filter(host => host.isTrustedHost);
  const otherHosts = hosts.filter(host => !host.isTrustedHost);

  return (
    <React.Fragment>
      {isEmpty && (
        <MessageBox mb={3} type="warning">
          <FormattedMessage defaultMessage="We could not find a host that matches all your criteria." />
        </MessageBox>
      )}

      {featuredHosts.length !== 0 && (
        <Box mb={3}>
          <FeaturedFiscalHostResults
            collective={props.collective}
            hosts={featuredHosts}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}
      {otherHosts.length !== 0 && (
        <Box padding={4}>
          <OtherFiscalHostResults
            collective={props.collective}
            hosts={otherHosts}
            totalCount={displayData.hosts.totalCount - featuredHosts.length}
            onHostApplyClick={props.onHostApplyClick}
          />
        </Box>
      )}
    </React.Fragment>
  );
}

const I18nMessages = defineMessages({
  ALL_COUNTRIES: {
    defaultMessage: 'All countries',
  },
  ANY_CURRENCY: {
    defaultMessage: 'Any currency',
  },
});

export default function StartAcceptingFinancialContributionsPage(props: StartAcceptingFinancialContributionsPageProps) {
  const intl = useIntl();
  const allCountriesSelectOption = { value: 'ALL', label: intl.formatMessage(I18nMessages.ALL_COUNTRIES) };
  const allCurrenciesSelectOption = { value: 'ANY', label: intl.formatMessage(I18nMessages.ANY_CURRENCY) };
  const [selectedCommunityType, setSelectedCommunityType] = React.useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = React.useState('ALL');
  const currencyOptions = [allCurrenciesSelectOption, ...Currency.map(c => ({ value: c, label: c }))];
  const [selectedCurrency, setSelectedCurrency] = React.useState(currencyOptions[0]);

  return (
    <Flex my={5} alignItems="center" flexDirection="column">
      <Illustration
        alt="A place to grow and thrive illustration"
        src="/static/images/fiscal-hosting/what-is-a-fiscalhost-illustration.png"
      />
      <Box mt={4} mb={4}>
        <H1
          fontSize={['20px', '32px']}
          lineHeight={['24px', '40px']}
          fontWeight="700"
          color="black.900"
          textAlign="center"
        >
          <FormattedMessage id="contributions.startAccepting" defaultMessage="Start accepting contributions" />
        </H1>
        <P mt={3} fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700" textAlign="center">
          <FormattedMessage defaultMessage="Choose who will hold the money on your behalf" />
        </P>
      </Box>
      <StyledCard width={['300px', '400px', '600px', '800px']} padding="32px 24px">
        <P mb={2} fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800">
          <FormattedMessage defaultMessage="What type of community are you?" />
        </P>
        <StyledFilters
          multiSelect
          filters={CommunityTypes}
          onChange={setSelectedCommunityType}
          selected={selectedCommunityType}
          flexWrap="wrap"
        />

        <Flex gap={'40px'} flexWrap="wrap" mt={4}>
          <Box flexGrow={1}>
            <P fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800" mb={2}>
              <FormattedMessage defaultMessage="Where would your collective be most active?" />
            </P>
            <InputTypeCountry
              value={selectedCountry}
              onChange={setSelectedCountry}
              customOptions={[allCountriesSelectOption]}
            />
            <P color="black.600" fontWeight="400" fontSize="11px" lineHeight="16px">
              <FormattedMessage defaultMessage="If multiple areas, please select most prominent of them all." />
            </P>
          </Box>
          <Box flexGrow={1}>
            <P fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800" mb={2}>
              <FormattedMessage defaultMessage="What currency will your collective use?" />
            </P>
            <StyledSelect
              value={selectedCurrency}
              inputId="currency-input"
              options={currencyOptions}
              onChange={setSelectedCurrency}
            />
          </Box>
        </Flex>
      </StyledCard>

      <Box mt={3} width={['360px', '500px', '700px', '900px']}>
        <FindAHostSearch
          collective={props.collective}
          selectedCommunityType={selectedCommunityType}
          selectedCountry={selectedCountry}
          selectedCurrency={selectedCurrency.value}
          onHostApplyClick={host => {
            props.onChange('chosenHost', host);
          }}
        />
      </Box>

      <Box mt={3} width={['360px', '500px', '700px', '900px']}>
        <HowToUseOpenCollective />
      </Box>
    </Flex>
  );
}
