import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import Loading from '../Loading';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledFilters from '../StyledFilters';
import StyledHr from '../StyledHr';
import StyledSelect from '../StyledSelect';
import { H1, P } from '../Text';

import HostCollectiveCard from './HostCollectiveCard';

export type StartAcceptingFinancialContributionsPageProps = {
  collective: {
    slug: string;
  };
};

const RoundOr = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f6ff;
  color: #1869f5;
  text-transform: uppercase;
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-size: 20px;
  line-height: 18px;
  margin: 20px 0;
`;

const Illustration = styled.img`
  width: 160px;
  height: 160px;
  object-fit: cover;
`;

const CommunityTypes = ['Open Source', 'Mutual Aid', 'Climate Change', 'BLM', 'Indigenous', 'Education', 'Festival'];

function IndependentCollectiveCard(props: { collective: { slug: string } }) {
  const router = useRouter();
  return (
    <StyledCard width="800px" padding="32px 24px">
      <Flex>
        <Box>
          <Illustration
            alt="A place to grow and thrive illustration"
            src="/static/images/fiscal-hosting/what-is-a-fiscalhost-illustration.png"
          />
        </Box>
        <Flex
          pl="20px"
          fontWeight={400}
          fontSize="15px"
          lineHeight="22px"
          flexDirection="column"
          justifyContent="center"
        >
          <P fontSize="20px" mb={3} lineHeight="28px" fontWeight="700" color="black.800">
            <FormattedMessage defaultMessage="I want to be an Independent Collective" />
          </P>
          <FormattedMessage
            defaultMessage="You will need your own bank account, you will have to be your own legal entity and take care of accounting, invoices, taxes, admins, payments and liability. <link>Read more</link>"
            values={{
              link: getI18nLink({
                as: Link,
                openInNewTab: true,
                href: 'https://docs.opencollective.com/help/independent-collectives',
              }),
            }}
          />
        </Flex>
      </Flex>
      <StyledButton
        onClick={() => router.push(`/${props.collective.slug}/accept-financial-contributions/ourselves`)}
        mt={3}
        buttonStyle="primary"
        width="100%"
      >
        <FormattedMessage id="acceptContributions.picker.ourselves" defaultMessage="Independent Collective" />
      </StyledButton>
    </StyledCard>
  );
}

const FindAFiscalHostQuery = gql`
  query FindAFiscalHostQuery($tags: [String], $limit: Int) {
    hosts(tag: $tags, limit: $limit) {
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
      }
    }
  }
`;

function FiscalAHostSearch(props: { selectedCommunityType: string }) {
  const { data, loading } = useQuery(FindAFiscalHostQuery, {
    variables: {
      tags: props.selectedCommunityType ? [props.selectedCommunityType] : [],
      limit: 50,
    },
    context: API_V2_CONTEXT,
  });

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

  const hosts = data?.hosts?.nodes || [];
  if (hosts.length === 0) {
    return <div>Empty state</div>;
  }

  return hosts.map(host => {
    /* @ts-ignore HostCollectiveCard is not typed */
    return <HostCollectiveCard key={host.slug} host={host} />;
  });
}

export default function StartAcceptingFinancialContributionsPage(props: StartAcceptingFinancialContributionsPageProps) {
  const [selectedCommunityType, setSelectedCommunityType] = React.useState();
  const [searchingForFiscalHost, setSearchingForFiscalHost] = React.useState(false);

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
      <StyledCard width="800px" padding="32px 24px">
        <P mb={1} fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800">
          <FormattedMessage defaultMessage="What type of community are you?" />
        </P>
        <StyledFilters filters={CommunityTypes} onChange={setSelectedCommunityType} selected={selectedCommunityType} />

        <P mt={4} fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800">
          <FormattedMessage defaultMessage="Where would your collective be most active?" />
        </P>
        <StyledSelect
          value={{ value: 'All countries', label: 'All countries' }}
          inputId="country-input"
          options={[{ value: 'All countries', label: 'All countries' }]}
        />
        <P color="black.600" fontWeight="400" fontSize="11px" lineHeight="16px">
          <FormattedMessage defaultMessage="If multiple areas, please select most prominent of them all." />
        </P>

        {!searchingForFiscalHost && (
          <React.Fragment>
            <StyledHr borderTopColor="black.200" mt={4} />

            <P mt={4} fontSize="20px" lineHeight="28px" fontWeight="700" color="black.800">
              <FormattedMessage defaultMessage="Continue with a Fiscal Host" />
            </P>
            <Flex mt={3}>
              <Box>
                <Illustration
                  alt="A place to grow and thrive illustration"
                  src="/static/images/watering-plants-bird-illustration.png"
                />
              </Box>
              <Flex
                pl="20px"
                fontWeight={400}
                fontSize="15px"
                lineHeight="22px"
                flexDirection="column"
                justifyContent="center"
              >
                <FormattedMessage
                  defaultMessage="A fiscal host allows you to start accepting contributions without the need to set up a legal entity and bank account for your project. The host will hold funds on your behalf, and will take care of accounting, invoices, taxes, admin, payments, and liability. You can use their NGO Status to raise runds. <link>Read more</link>"
                  values={{
                    link: getI18nLink({
                      as: Link,
                      openInNewTab: true,
                      href: 'https://opencollective.com/fiscal-hosting',
                    }),
                  }}
                />
              </Flex>
            </Flex>
            <StyledButton onClick={() => setSearchingForFiscalHost(true)} mt={3} buttonStyle="primary" width="100%">
              <FormattedMessage defaultMessage="Search for Fiscal Hosts" />
            </StyledButton>
          </React.Fragment>
        )}
      </StyledCard>
      {!searchingForFiscalHost && (
        <React.Fragment>
          <RoundOr>
            <FormattedMessage defaultMessage="Or" />
          </RoundOr>
          <IndependentCollectiveCard collective={props.collective} />
        </React.Fragment>
      )}

      {searchingForFiscalHost && (
        <Box mt={3} width="800px">
          <FiscalAHostSearch selectedCommunityType={selectedCommunityType} />
        </Box>
      )}
    </Flex>
  );
}
