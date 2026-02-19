import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { CheckCircle2, Shield } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { AccountReferenceInput } from '@/lib/graphql/types/v2/graphql';

import { DocumentationCardList } from '@/components/documentation/DocumentationCardList';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';

type KYCRequestIntroductionProps = {
  requestedByAccount: AccountReferenceInput;
  onNext: () => void;
  skipIntroductionSet: boolean;
};

export function KYCRequestIntroduction(props: KYCRequestIntroductionProps) {
  const [editAccountSetting, { loading: isSaving }] = useMutation(
    gql`
      mutation SetRYCRequestIntroductionSkip($account: AccountReferenceInput!, $value: JSON!) {
        editAccountSetting(account: $account, key: "kyc.skipRequestIntroduction", value: $value) {
          id
          settings
        }
      }
    `,
    {
      variables: {
        account: props.requestedByAccount,
      },
    },
  );

  const onSkipIntroductionChange = React.useCallback(
    async (checked: boolean) => {
      try {
        await editAccountSetting({
          variables: {
            value: checked,
          },
        });
      } catch (error) {
        // dont fail progression if this setting is not saved
        // eslint-disable-next-line no-console
        console.error('Failed to save skip introduction setting:', error);
      }
    },
    [editAccountSetting],
  );

  return (
    <React.Fragment>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Know Your Customer (KYC)
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6 py-4">
        <div className="space-y-4 text-sm text-slate-700">
          <p className="leading-relaxed">
            <FormattedMessage
              defaultMessage="KYC verification helps your organization ensure compliance and security by verifying the identity and legal information of accounts."
              id="esVlWl"
            />
          </p>

          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <h4 className="font-semibold text-slate-900">
              <FormattedMessage defaultMessage="What is verified:" id="mO9Ndv" />
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <FormattedMessage defaultMessage="Legal name of the account holder" id="0rLm3g" />
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <FormattedMessage defaultMessage="Legal address for compliance purposes" id="xrXte8" />
                </span>
              </li>
            </ul>
          </div>

          <DocumentationCardList
            className="mt-6"
            docs={[
              {
                href: 'https://documentation.opencollective.com/fiscal-hosts/know-your-customer-kyc',
                title: 'Know Your Customer (KYC)',
                excerpt:
                  'KYC (Know Your Customer) verification is a critical process that helps organizations ensure compliance with regulatory requirements. It involves verifying the identity and legal information of account holders to prevent fraud and maintain security standards.',
              },
            ]}
          />
        </div>
        <div className="flex items-center space-x-2 border-t border-slate-200 pt-4">
          <Checkbox
            id="skip-introduction"
            checked={props.skipIntroductionSet}
            onCheckedChange={onSkipIntroductionChange}
            disabled={isSaving}
          />
          <Label htmlFor="skip-introduction" className="cursor-pointer text-sm font-normal text-slate-700">
            <FormattedMessage defaultMessage="Skip this introduction next time" id="M0w2dH" />
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={props.onNext} disabled={isSaving}>
          <FormattedMessage id="actions.continue" defaultMessage="Continue" />
        </Button>
      </DialogFooter>
    </React.Fragment>
  );
}
