import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { pick } from 'lodash';
import { ArrowLeft, Building2, Globe, Loader2, Search, Sparkles } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getEnvVar } from '@/lib/env-utils';
import type {
  OffPlatformTransactionsInstitutionsQuery,
  OffPlatformTransactionsInstitutionsQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import type { OffPlatformTransactionsInstitution } from '@/lib/graphql/types/v2/schema';
import { OffPlatformTransactionsProvider } from '@/lib/graphql/types/v2/schema';
import { i18nCountryName } from '@/lib/i18n';
import { LOCAL_STORAGE_KEYS, setLocalStorage } from '@/lib/local-storage';
import { cn } from '@/lib/utils';

import MessageBoxGraphqlError from '@/components/MessageBoxGraphqlError';

import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Card, CardContent } from '../../../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../ui/Dialog';
import { Input } from '../../../ui/Input';
import { useToast } from '../../../ui/useToast';

// GoCardless supported countries. Keep this in sync with `api/server/lib/gocardless/connect.ts`.
const GOCARDLESS_SUPPORTED_COUNTRIES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czechia
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IS', // Iceland
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LI', // Liechtenstein
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'NO', // Norway
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
  'GB', // United Kingdom
] as const;

const offPlatformTransactionsInstitutionsQuery = gql`
  query OffPlatformTransactionsInstitutions($country: String!, $provider: OffPlatformTransactionsProvider!) {
    offPlatformTransactionsInstitutions(country: $country, provider: $provider) {
      id
      name
      bic
      logoUrl
      supportedCountries
      maxAccessValidForDays
      transactionTotalDays
    }
  }
`;

const generateGoCardlessLinkMutation = gql`
  mutation GenerateGoCardlessLink($input: GoCardlessLinkInput!) {
    generateGoCardlessLink(input: $input) {
      id
      institutionId
      link
      redirect
    }
  }
`;

type Region = 'US' | 'EU' | 'OTHER';

const CountryCard = ({
  countryCode,
  isSelected,
  onClick,
  isHost = false,
}: {
  countryCode: string;
  isSelected: boolean;
  onClick: () => void;
  isHost?: boolean;
}) => {
  const intl = useIntl();

  return (
    <Button
      variant="ghost"
      className={cn(
        'h-auto w-full justify-start p-0 transition-colors hover:bg-primary/5',
        isSelected && 'ring-2 ring-primary',
      )}
      onClick={onClick}
    >
      <Card className="w-full bg-transparent">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-left font-medium">
              <span className="mr-2">{getEmojiByCountryCode(countryCode)}</span>
              <span>{i18nCountryName(intl, countryCode)}</span>
            </h3>
            {isHost && (
              <div className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                <Badge type="info" size="sm">
                  <FormattedMessage defaultMessage="Host" id="host.label" />
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Button>
  );
};

const RegionStep = ({
  selectedRegion,
  onRegionSelect,
  isLoading,
}: {
  selectedRegion: Region | null;
  onRegionSelect: (region: Region) => void;
  isLoading: boolean;
}) => {
  const intl = useIntl();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <FormattedMessage defaultMessage="Where is your bank account located?" id="3Mj+r/" />
      </p>
      <div className="grid gap-3">
        <Button
          variant="ghost"
          className={cn(
            'h-auto w-full justify-start p-0 transition-colors hover:bg-primary/5',
            selectedRegion === 'US' && 'ring-2 ring-primary',
          )}
          onClick={() => onRegionSelect('US')}
        >
          <Card className="w-full bg-transparent">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">🇺🇸</div>
                <div>
                  <h3 className="text-left font-medium">{i18nCountryName(intl, 'US')}</h3>
                  <p className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Connect via Plaid" id="connect.via.plaid" />
                  </p>
                </div>
              </div>
              {isLoading && <Loader2 className="mr-4 h-6 w-6 animate-spin text-gray-500" />}
            </CardContent>
          </Card>
        </Button>

        <Button
          variant="ghost"
          className={cn(
            'h-auto w-full justify-start p-0 transition-colors hover:bg-primary/5',
            selectedRegion === 'EU' && 'ring-2 ring-primary',
            isLoading && 'pointer-events-none cursor-not-allowed opacity-50',
          )}
          onClick={() => onRegionSelect('EU')}
          disabled={isLoading}
        >
          <Card className="w-full bg-transparent">
            <CardContent className="flex items-center space-x-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">🇪🇺</div>
              <div>
                <h3 className="text-left font-medium">
                  <FormattedMessage defaultMessage="Europe" id="X3AIiK" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage defaultMessage="Connect via GoCardless" id="YX9cQw" />
                </p>
              </div>
            </CardContent>
          </Card>
        </Button>

        <Card className="pointer-events-none cursor-not-allowed opacity-50">
          <CardContent className="flex items-center space-x-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Globe className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-left font-medium">
                <FormattedMessage defaultMessage="Other" id="other" />
              </h3>
              <p className="text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="Not supported yet" id="gT672Y" />
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const isHostCountrySupportedByGoCardLess = (
  hostCountry: string,
): hostCountry is (typeof GOCARDLESS_SUPPORTED_COUNTRIES)[number] => {
  return (GOCARDLESS_SUPPORTED_COUNTRIES as readonly string[]).includes(hostCountry);
};

const CountryStep = ({
  selectedCountry,
  onCountrySelect,
  onBack,
  hostCountry,
}: {
  selectedCountry: string | null;
  onCountrySelect: (country: string) => void;
  onBack: () => void;
  hostCountry: string;
}) => {
  const filteredCountries = React.useMemo(() => {
    const countries = [...GOCARDLESS_SUPPORTED_COUNTRIES];

    let hostCountryCard = null;
    if (isHostCountrySupportedByGoCardLess(hostCountry)) {
      countries.splice(countries.indexOf(hostCountry), 1);
      hostCountryCard = (
        <div className="mb-3 border-b pb-3">
          <CountryCard
            key={hostCountry}
            countryCode={hostCountry}
            isSelected={selectedCountry === hostCountry}
            onClick={() => onCountrySelect(hostCountry)}
            isHost={true}
          />
        </div>
      );
    }

    return { countries, hostCountryCard };
  }, [hostCountry, selectedCountry, onCountrySelect]);

  const { countries, hostCountryCard } = filteredCountries;
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage defaultMessage="Select the bank country" id="g5xQjq" />
        </p>
      </div>
      {hostCountryCard}
      <div className="grid max-h-96 gap-2 overflow-y-auto p-1">
        {countries.length ? (
          countries.map(countryCode => (
            <CountryCard
              key={countryCode}
              countryCode={countryCode}
              isSelected={selectedCountry === countryCode}
              onClick={() => onCountrySelect(countryCode)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="No countries found" id="3BTtL2" />
          </div>
        )}
      </div>
    </div>
  );
};

const InstitutionStep = ({
  selectedCountry,
  selectedInstitution,
  setSelectedInstitution,
  onBack,
  hostId,
}: {
  selectedCountry: string;
  selectedInstitution: OffPlatformTransactionsInstitution | null;
  setSelectedInstitution: (institution: OffPlatformTransactionsInstitution) => void;
  onBack: () => void;
  hostId: string;
}) => {
  const intl = useIntl();
  const [institutionFilter, setInstitutionFilter] = React.useState('');
  const { toast } = useToast();
  const {
    data: institutionsData,
    loading: institutionsLoading,
    error: institutionsError,
  } = useQuery<OffPlatformTransactionsInstitutionsQuery, OffPlatformTransactionsInstitutionsQueryVariables>(
    offPlatformTransactionsInstitutionsQuery,
    {
      context: API_V2_CONTEXT,
      variables: {
        country: selectedCountry,
        provider: OffPlatformTransactionsProvider.GOCARDLESS,
      },
    },
  );
  const [generateGoCardlessLink, { loading: isGeneratingLink, data: generateGoCardlessLinkResponse }] = useMutation(
    generateGoCardlessLinkMutation,
    {
      context: API_V2_CONTEXT,
    },
  );

  const handleInstitutionSelect = async (institution: OffPlatformTransactionsInstitution) => {
    setSelectedInstitution(institution);

    try {
      const result = await generateGoCardlessLink({
        variables: {
          input: {
            institutionId: institution.id,
            userLanguage: intl.locale ?? 'en',
            accountSelection: true,
          },
        },
      });

      const link = result.data?.generateGoCardlessLink?.link;
      if (link) {
        // Redirect to the GoCardless authorization page
        setLocalStorage(
          LOCAL_STORAGE_KEYS.GOCARDLESS_DATA,
          JSON.stringify({
            date: new Date().toISOString(),
            hostId,
            requisitionId: result.data?.generateGoCardlessLink?.id,
          }),
        );
        window.location.href = link;
      } else {
        throw new Error('No link received from GoCardless');
      }
    } catch (error) {
      toast({
        variant: 'error',
        title: intl.formatMessage({ defaultMessage: 'Connection failed', id: 'connection.failed' }),
        message: intl.formatMessage(
          {
            defaultMessage: 'Failed to generate GoCardless link: {error}',
            id: 'gocardless.link.error',
          },
          { error: error instanceof Error ? error.message : 'Unknown error' },
        ),
      });
      // Reset the selected institution on error
      setSelectedInstitution(null);
    }
  };

  // Filter institutions based on search input
  const filteredInstitutions = React.useMemo(() => {
    let institutions = institutionsData?.offPlatformTransactionsInstitutions || [];

    // Add GoCardless sandbox institution in non-production environments
    if (getEnvVar('OC_ENV') !== 'production') {
      const sandboxInstitution: OffPlatformTransactionsInstitution = {
        id: 'SANDBOXFINANCE_SFIN0000',
        name: 'Sandbox Finance (GoCardless)',
        bic: 'SANDBOXFINANCE',
        logoUrl: null,
        supportedCountries: [...GOCARDLESS_SUPPORTED_COUNTRIES],
        maxAccessValidForDays: 90,
        transactionTotalDays: 90,
      } as const;

      // Add sandbox institution at the beginning of the list
      institutions = [sandboxInstitution, ...institutions];
    }

    if (!institutionFilter.trim()) {
      return institutions;
    }

    const filter = institutionFilter.toLowerCase().trim();
    if (!filter) {
      return institutions;
    }

    return institutions.filter(
      institution =>
        institution.name.toLowerCase().includes(filter) ||
        (institution.bic && institution.bic.toLowerCase().includes(filter)),
    );
  }, [institutionsData?.offPlatformTransactionsInstitutions, institutionFilter]);

  const isRedirecting = Boolean(generateGoCardlessLinkResponse?.generateGoCardlessLink?.link);
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isGeneratingLink || isRedirecting}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          <FormattedMessage
            defaultMessage="Select your bank in {country}"
            id="select.bank.in.country"
            values={{ country: i18nCountryName(intl, selectedCountry) }}
          />
        </p>
      </div>
      {institutionsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <FormattedMessage defaultMessage="Loading banks..." id="loading.banks" />
          </div>
        </div>
      ) : institutionsError ? (
        <MessageBoxGraphqlError error={institutionsError} />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="institution-search"
              placeholder={intl.formatMessage({
                defaultMessage: 'Search banks by name or BIC...',
                id: 'search.banks.placeholder',
              })}
              value={institutionFilter}
              onChange={e => setInstitutionFilter(e.target.value)}
              className="pl-10"
              disabled={isGeneratingLink || isRedirecting}
            />
          </div>
          <div className="grid max-h-96 gap-2 overflow-x-visible overflow-y-auto p-1">
            {filteredInstitutions.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="No banks found" id="qH3F3w" values={{ filter: institutionFilter }} />
              </div>
            ) : (
              filteredInstitutions.map(institution => (
                <Button
                  key={institution.id}
                  variant="ghost"
                  className={cn(
                    'h-auto w-full justify-start p-0 transition-colors hover:bg-primary/5',
                    selectedInstitution?.id === institution.id && 'ring-2 ring-primary',
                    (isGeneratingLink || isRedirecting) && 'pointer-events-none cursor-not-allowed opacity-50',
                  )}
                  onClick={() => handleInstitutionSelect(institution)}
                  disabled={isGeneratingLink || isRedirecting}
                >
                  <Card className="w-full bg-transparent">
                    <CardContent className="flex items-center space-x-3 p-3">
                      {institution.logoUrl ? (
                        <img src={institution.logoUrl} alt={institution.name} className="h-8 w-8 object-contain" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          <Building2 className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <h3 className="font-medium">{institution.name}</h3>
                        {institution.bic && <p className="text-sm text-muted-foreground">BIC: {institution.bic}</p>}
                      </div>
                      {(isGeneratingLink || isRedirecting) && selectedInstitution?.id === institution.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </CardContent>
                  </Card>
                </Button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const NewOffPlatformTransactionsConnection = ({
  isOpen,
  onOpenChange,
  onPlaidConnect,
  hostCountry,
  hostId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaidConnect: () => void;
  hostCountry: string;
  hostId: string;
}) => {
  const [step, setStep] = React.useState<'region' | 'country' | 'institution'>('region');
  const [selectedRegion, setSelectedRegion] = React.useState<Region | null>(null);
  const [selectedCountry, setSelectedCountry] = React.useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = React.useState<OffPlatformTransactionsInstitution | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);

    if (region === 'US') {
      setIsLoading(true);
      onPlaidConnect();
    } else if (region === 'EU') {
      setStep('country');
    }
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setStep('institution');
  };

  const handleBack = () => {
    if (step === 'country') {
      setStep('region');
      setSelectedRegion(null);
    } else if (step === 'institution') {
      setStep('country');
      setSelectedCountry(null);
      setSelectedInstitution(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('region');
    setSelectedRegion(null);
    setSelectedCountry(null);
    setSelectedInstitution(null);
  };

  const renderStep = () => {
    switch (step) {
      case 'region':
        return <RegionStep selectedRegion={selectedRegion} onRegionSelect={handleRegionSelect} isLoading={isLoading} />;
      case 'country':
        return (
          <CountryStep
            selectedCountry={selectedCountry}
            onCountrySelect={handleCountrySelect}
            onBack={handleBack}
            hostCountry={hostCountry}
          />
        );
      case 'institution':
        return (
          <InstitutionStep
            selectedCountry={selectedCountry!}
            selectedInstitution={selectedInstitution}
            setSelectedInstitution={setSelectedInstitution}
            onBack={handleBack}
            hostId={hostId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            <FormattedMessage defaultMessage="New Connection" id="NRwiLl" />
          </DialogTitle>
        </DialogHeader>

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
