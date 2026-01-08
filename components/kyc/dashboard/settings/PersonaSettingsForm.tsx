import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { CheckCircle2, HelpCircle, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { getAccountReferenceInput } from '@/lib/collective';
import { i18nGraphqlException } from '@/lib/errors';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';

import { FormField } from '@/components/FormField';
import { useFormikZod } from '@/components/FormikZod';
import { getI18nLink } from '@/components/I18nFormatters';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/useToast';

const personaAccountSetupFormSchema = z.object({
  apiKeyId: z.string().min(1),
  apiKey: z.string().min(1),
  inquiryTemplateId: z.string().min(1),
});

type PersonaSettingsFormProps = {
  account: AccountReferenceInput;
  initialValues: z.infer<typeof personaAccountSetupFormSchema>;
};

export function PersonaSettingsForm(props: PersonaSettingsFormProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [helpOpen, setHelpOpen] = React.useState(false);

  const [provisionMutation] = useMutation(
    gql`
      mutation ProvisionPersonaKYC(
        $account: AccountReferenceInput!
        $apiKey: String!
        $apiKeyId: String!
        $inquiryTemplateId: String!
      ) {
        createConnectedAccount(
          account: $account
          connectedAccount: {
            service: persona
            data: { apiKey: $apiKey, apiKeyId: $apiKeyId, inquiryTemplateId: $inquiryTemplateId }
          }
        ) {
          id
          settings
          service
          createdAt
          updatedAt
        }
      }
    `,
    {
      refetchQueries: ['KYCSettings'],
    },
  );

  const form = useFormikZod({
    schema: personaAccountSetupFormSchema,
    initialValues: props.initialValues,
    async onSubmit(values) {
      const errors = await form.validateForm();
      if (!isEmpty(errors)) {
        return;
      }

      try {
        await provisionMutation({
          variables: {
            account: getAccountReferenceInput(props.account),
            apiKey: values.apiKey,
            apiKeyId: values.apiKeyId,
            inquiryTemplateId: values.inquiryTemplateId,
          },
        });
        toast({
          variant: 'success',
          message: intl.formatMessage({
            defaultMessage: 'Persona account connected successfully',
            id: 'r4WIFQ',
          }),
        });
      } catch (e) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
      }
    },
  });

  return (
    <FormikContext value={form}>
      <div className="space-y-6 py-2">
        <h3 className="text-base font-semibold text-slate-900">
          <FormattedMessage defaultMessage="Persona account settings" id="8VYikx" />
        </h3>

        {helpOpen ? (
          <Alert variant="info" className="relative">
            <div className="pr-8">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex-1">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>
                      <FormattedMessage
                        defaultMessage="To connect your Persona account, you'll need to retrieve your API credentials and inquiry template ID from your Persona dashboard."
                        id="Oj7CpL"
                      />
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>
                          <FormattedMessage
                            defaultMessage="Log in to your Persona dashboard at <PersonaLink>https://withpersona.com</PersonaLink>"
                            id="1nBkjD"
                            values={{
                              PersonaLink: getI18nLink({
                                href: 'https://withpersona.com/',
                                openInNewTab: true,
                                fontWeight: 'bold',
                              }),
                            }}
                          />
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>
                          <FormattedMessage
                            defaultMessage="Navigate to Settings → API Keys to find your API Key ID and API Key"
                            id="GXPtjf"
                          />
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span>
                          <FormattedMessage
                            defaultMessage="Go to Templates to find your Inquiry Template ID"
                            id="QB+ZJU"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2"
              onClick={() => setHelpOpen(false)}
              aria-label="Dismiss help"
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm text-slate-600">
              <FormattedMessage defaultMessage="Need help finding your Persona credentials?" id="cniTUl" />
            </p>
            <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)} className="gap-2">
              <HelpCircle className="h-4 w-4" />
              <FormattedMessage defaultMessage="Show Help" id="xfyjRQ" />
            </Button>
          </div>
        )}

        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormField
            name="apiKeyId"
            disabled={form.isSubmitting}
            label={<FormattedMessage defaultMessage="API Key ID" id="qDCH1M" />}
            hint={
              <FormattedMessage defaultMessage="Found in Persona dashboard under Settings → API Keys" id="s9V0Zz" />
            }
            required
          />
          <FormField
            name="apiKey"
            disabled={form.isSubmitting}
            label={<FormattedMessage defaultMessage="API Key" id="4dZi3Y" />}
            hint={<FormattedMessage defaultMessage="Your secret API key from Persona (keep this secure)" id="KrWgZK" />}
            required
            type="text"
          />
          <FormField
            name="inquiryTemplateId"
            disabled={form.isSubmitting}
            label={<FormattedMessage defaultMessage="Inquiry Template ID" id="hupLU1" />}
            hint={
              <FormattedMessage
                defaultMessage="The ID of the inquiry template you want to use for KYC verifications"
                id="BKPEaA"
              />
            }
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" loading={form.isSubmitting}>
              <FormattedMessage defaultMessage="Save Persona settings" id="OBAUs0" />
            </Button>
          </div>
        </form>
      </div>
    </FormikContext>
  );
}
