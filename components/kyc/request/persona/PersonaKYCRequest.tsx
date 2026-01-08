import React from 'react';

import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';

import type { KYCRequestModalProviderOptions } from '../KYCRequestModal';

import { PersonaConnectedAccountSetup } from './PersonaConnectedAccountSetup';
import { PersonaImportInquiry } from './PersonaImportInquiry';

type PersonaKYCRequestProps = {
  onBack: () => void;
  onNext: () => void;
  requestedByAccount: AccountReferenceInput;
  verifyAccount: AccountReferenceInput;
  hasPersonaConnectedAccount: boolean;
  refetchQueries?: string[];
  options?: KYCRequestModalProviderOptions['persona'];
  backLabel: React.ReactNode;
};

enum Steps {
  PERSONA_SETUP = 'PERSONA_SETUP',
  FORM = 'FORM',
}

export function PersonaKYCRequest(props: PersonaKYCRequestProps) {
  const [step, setStep] = React.useState<Steps>(props.hasPersonaConnectedAccount ? Steps.FORM : Steps.PERSONA_SETUP);

  return (
    <div>
      {step === Steps.PERSONA_SETUP && (
        <PersonaConnectedAccountSetup
          onNext={() => {
            setStep(Steps.FORM);
          }}
          account={props.requestedByAccount}
          onBack={props.onBack}
        />
      )}
      {step === Steps.FORM && (
        <PersonaImportInquiry
          backLabel={props.backLabel}
          onBack={props.onBack}
          onNext={props.onNext}
          refetchQueries={props.refetchQueries}
          requestedByAccount={props.requestedByAccount}
          verifyAccount={props.verifyAccount}
        />
      )}
    </div>
  );
}
