import React from 'react';
import { Sparkles } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';

import { Button } from '@/components/ui/Button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

import { PersonaSettingsForm } from '../../dashboard/settings/PersonaSettingsForm';
import type { KYCRequestModalProviderOptions } from '../KYCRequestModal';

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
        <div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <FormattedMessage defaultMessage="Connect Persona Account" id="i2gR60" />
            </DialogTitle>
          </DialogHeader>
          <PersonaSettingsForm
            account={props.requestedByAccount}
            initialValues={{}}
            onSuccess={() => {
              setStep(Steps.FORM);
            }}
            renderFormButtons={form => (
              <DialogFooter>
                <Button variant="outline" onClick={props.onBack}>
                  <FormattedMessage defaultMessage="Back" id="Back" />
                </Button>
                <Button onClick={form.submitForm}>
                  <FormattedMessage defaultMessage="Connect Account" id="oZneLZ" />
                </Button>
              </DialogFooter>
            )}
          />
        </div>
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
