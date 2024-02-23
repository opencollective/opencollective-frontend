import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Currency } from '../../lib/constants/currency';
import type { Collective } from '../../lib/graphql/types/v2/graphql';
import useDebounced from '../../lib/hooks/useDebounced';

import Container from '../Container';
import HowToUseOpenCollective from '../fiscal-hosting/HowCanAFiscalHostHelpSection';
import { Box, Flex } from '../Grid';
import InputTypeCountry from '../InputTypeCountry';
import SearchIcon from '../SearchIcon';
import StyledCard from '../StyledCard';
import StyledFilters from '../StyledFilters';
import StyledInput from '../StyledInput';
import StyledLink from '../StyledLink';
import StyledSelect from '../StyledSelect';
import { H1, P } from '../Text';

import FindAHostSearch from './FindAHostSearch';

export type StartAcceptingFinancialContributionsPageProps = {
  collective: Collective;
  onChange: (field: string, value: unknown) => void;
};

const Illustration = styled.img`
  width: 150px;
  height: 150px;
  object-fit: cover;
`;

const CommunityTypesToTags = {
  'Open Source': ['open source', 'opensource', 'open-source'],
  'Mutual Aid': ['mutual aid', 'covid', 'covid-19'],
  Education: ['education', 'meetup', 'tech meetup'],
  'Civic Tech': [''],
  'Arts & Culture': ['arts and culture', 'art', 'arts', 'visual art', 'visual arts', 'music'],
  Climate: ['climate', 'climate change', 'climate crisis', 'climate action', 'climate emergency'],
};

const CommunityTypes = Object.keys(CommunityTypesToTags);

const I18nMessages = defineMessages({
  ALL_COUNTRIES: {
    defaultMessage: 'All countries',
  },
  ANY_CURRENCY: {
    defaultMessage: 'Any currency',
  },
  SEARCH_PLACEHOLDER: {
    id: 'findAFiscalHost.searchPlaceholder',
    defaultMessage: 'Search by name',
  },
});

const SearchInput = styled(StyledInput)`
  width: 100%;
  border-radius: 20px;
  padding-left: 30px;
`;

export default function StartAcceptingFinancialContributionsPage(props: StartAcceptingFinancialContributionsPageProps) {
  const intl = useIntl();
  const allCountriesSelectOption = { value: 'ALL', label: intl.formatMessage(I18nMessages.ALL_COUNTRIES) };
  const allCurrenciesSelectOption = { value: 'ANY', label: intl.formatMessage(I18nMessages.ANY_CURRENCY) };
  const [selectedCommunityType, setSelectedCommunityType] = React.useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = React.useState('ALL');
  const currencyOptions = [allCurrenciesSelectOption, ...Currency.map(c => ({ value: c, label: c }))];
  const [selectedCurrency, setSelectedCurrency] = React.useState(currencyOptions[0]);
  const [searchTerm, setSearchTerm] = React.useState('');

  const debouncedSearchTerm = useDebounced(searchTerm, 500);

  // reset filters when doing textual search
  React.useEffect(() => {
    setSelectedCommunityType([]);
    setSelectedCountry('ALL');
    setSelectedCurrency(currencyOptions[0]);
  }, [debouncedSearchTerm]);

  const communityTags = selectedCommunityType.reduce((tags, community) => {
    return [...tags, ...CommunityTypesToTags[community]];
  }, []);

  return (
    <Flex my={5} alignItems="center" flexDirection="column">
      <Box
        display="grid"
        paddingX={[null, null, null, '100px']}
        width={['300px', '400px', '600px', '927px']}
        gridTemplateColumns="auto auto"
        gridTemplateRows="auto"
        py={4}
      >
        <Box gridColumn="1" justifySelf="center" gridRow={['2', '2', '1 / span 2']} my={2}>
          <Illustration
            alt="A place to grow and thrive illustration"
            src="/static/images/fiscal-hosting/what-is-a-fiscalhost-illustration.png"
          />
        </Box>
        <Box gridColumn={['1', '1', '2']} gridRow="1">
          <H1
            textAlign={['justify', 'justify', 'left']}
            fontSize={['20px', '32px']}
            lineHeight={['24px', '40px']}
            fontWeight="700"
            color="black.900"
          >
            <FormattedMessage defaultMessage="Accept contributions through a Fiscal Host" />
          </H1>
        </Box>
        <Box gridColumn={['1', '1', '2']} gridRow={['3', '3', '2']}>
          <P my={3} fontSize="16px" lineHeight="24px" fontWeight="500" color="black.700">
            <FormattedMessage defaultMessage="A fiscal host is an organization that welcomes others to operate through their structure, so projects can use the host’s legal entity and bank account instead of setting up their own. The host provides administrative services, oversight, and support. " />
          </P>
          <Box textAlign={['center', 'center', 'left']}>
            <StyledLink
              buttonSize="tiny"
              buttonStyle="secondary"
              href="https://opencollective.com/fiscal-hosting"
              openInNewTab
            >
              <FormattedMessage defaultMessage="Learn more" />
            </StyledLink>
          </Box>
        </Box>
      </Box>
      <StyledCard
        borderStyle={[null, null, 'solid', 'solid']}
        width={['300px', '400px', '600px', '927px']}
        padding="32px 24px"
      >
        <P mb={2} fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800">
          <FormattedMessage defaultMessage="Search for a Fiscal Host" />
        </P>

        <Container position="relative">
          <Container ml="12px" mt="12px" position="absolute">
            <SearchIcon size={16} fill="#aaaaaa" />
          </Container>

          <SearchInput
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            padding="20px"
            placeholder={intl.formatMessage(I18nMessages.SEARCH_PLACEHOLDER)}
          />
        </Container>

        <P mb={2} mt={4} fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800">
          <FormattedMessage defaultMessage="What categories describe your work?" />
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
              <FormattedMessage defaultMessage="Where are your financial contributors based?" />
            </P>
            <InputTypeCountry
              value={selectedCountry}
              onChange={setSelectedCountry}
              customOptions={[allCountriesSelectOption]}
            />
            <P color="black.600" fontWeight="400" fontSize="11px" lineHeight="16px" mt={2}>
              <FormattedMessage defaultMessage="If multiple areas, please select most prominent of them all." />
            </P>
          </Box>
          <Box flexGrow={1}>
            <P fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800" mb={2}>
              <FormattedMessage defaultMessage="What currency will your Collective use?" />
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

      <Box width={['300px', '400px', '600px', '927px']}>
        <FindAHostSearch
          collective={props.collective}
          communityTags={communityTags}
          searchTerm={debouncedSearchTerm}
          selectedCountry={selectedCountry}
          selectedCurrency={selectedCurrency.value}
          onHostApplyClick={host => {
            props.onChange('chosenHost', host);
          }}
        />
      </Box>

      <Box mt={4} width={['300px', '400px', '600px', '927px']}>
        <HowToUseOpenCollective />
      </Box>

      <Box textAlign={['center', 'center', 'left']}>
        <StyledLink
          buttonSize="medium"
          buttonStyle="primary"
          href="https://opencollective.com/fiscal-hosting"
          openInNewTab
        >
          <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
        </StyledLink>
      </Box>
    </Flex>
  );
}
