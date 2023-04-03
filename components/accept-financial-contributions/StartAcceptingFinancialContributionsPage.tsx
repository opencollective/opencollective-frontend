import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Currency } from '../../lib/constants/currency';
import { Collective } from '../../lib/graphql/types/v2/graphql';

import HowToUseOpenCollective from '../fiscal-hosting/HowCanAFiscalHostHelpSection';
import { Box, Flex } from '../Grid';
import InputTypeCountry from '../InputTypeCountry';
import StyledCard from '../StyledCard';
import StyledFilters from '../StyledFilters';
import StyledSelect from '../StyledSelect';
import { H1, P } from '../Text';

import FindAHostSearch from './FindAHostSearch';

export type StartAcceptingFinancialContributionsPageProps = {
  collective: Collective;
  onChange: (field: string, value: unknown) => void;
};

const Illustration = styled.img`
  width: 160px;
  height: 160px;
  object-fit: cover;
`;

const CommunityTypes = ['Open Source', 'Mutual Aid', 'Climate', 'BLM', 'Indigenous', 'Education', 'Festival'];

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
