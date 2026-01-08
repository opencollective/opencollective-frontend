import React from 'react';
import { useQuery } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { gql } from '@/lib/graphql/helpers';
import type {
  SubmitKycVerificationButtonQuery,
  SubmitKycVerificationButtonQueryVariables,
} from '@/lib/graphql/types/v2/graphql';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';
import { KycProvider } from '@/lib/graphql/types/v2/schema';

import { useModal } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

import type { KYCRequestModalProviderOptions } from './KYCRequestModal';
import { KYCRequestModal } from './KYCRequestModal';

type SubmitKYCVerificationButtonProps = {
  requestedByAccount: AccountReferenceInput;
  verifyAccount?: AccountReferenceInput;
  refetchQueries?: string[];
  className?: string;
};

export function SubmitKYCVerificationButton(props: SubmitKYCVerificationButtonProps) {
  const { showModal } = useModal();

  const hasRequestedByAccountSlug = Boolean(props.requestedByAccount?.slug);

  const { data, loading: featuresLoading } = useQuery<
    SubmitKycVerificationButtonQuery,
    SubmitKycVerificationButtonQueryVariables
  >(
    gql`
      query SubmitKYCVerificationButton($slug: String!) {
        account(slug: $slug, throwIfMissing: false) {
          id
          features {
            id
            KYC
            PERSONA_KYC
          }
        }
      }
    `,
    {
      skip: !hasRequestedByAccountSlug,
      variables: {
        slug: props.requestedByAccount?.slug,
      },
    },
  );

  const isKycEnabled = React.useMemo(
    () => (data?.account ? isFeatureEnabled(data.account, FEATURES.KYC) : false),
    [data],
  );

  const isPersonaKycEnabled = React.useMemo(
    () => (data?.account ? isFeatureEnabled(data.account, FEATURES.PERSONA_KYC) : false),
    [data],
  );

  const openKYCRequestModal = React.useCallback(
    (provider: KycProvider, providerOptions?: KYCRequestModalProviderOptions) => {
      showModal(KYCRequestModal, {
        requestedByAccount: props.requestedByAccount,
        verifyAccount: props.verifyAccount,
        refetchQueries: props.refetchQueries,
        provider,
        providerOptions,
      });
    },
    [showModal, props.requestedByAccount, props.verifyAccount, props.refetchQueries],
  );

  if (isPersonaKycEnabled) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={props.className}
            loading={featuresLoading}
            disabled={!isKycEnabled}
            size="xs"
            variant="outline"
          >
            <FormattedMessage defaultMessage="Submit KYC Verification" id="fS9N/M" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openKYCRequestModal(KycProvider.MANUAL)}>
            <FormattedMessage defaultMessage="Submit Manual Verification" id="RqP5GX" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openKYCRequestModal(KycProvider.PERSONA, { persona: { isImport: true } })}>
            <FormattedMessage defaultMessage="Import Persona Inquiry" id="7I2m2l" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={() => openKYCRequestModal(KycProvider.MANUAL)}
      className={props.className}
      loading={featuresLoading}
      disabled={!isKycEnabled}
      size="xs"
    >
      <FormattedMessage defaultMessage="Submit KYC Verification" id="fS9N/M" />
    </Button>
  );
}
