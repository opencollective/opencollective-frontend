import React from 'react';
import { useMutation } from '@apollo/client';
import { useFormikContext } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { formatErrorMessage, getErrorFromGraphqlException } from '@/lib/errors';

import { FormField } from '@/components/FormField';
import { FormikZod } from '@/components/FormikZod';
import { useToast } from '@/components/ui/useToast';

import { Button } from '../../ui/Button';
import { type ExpenseForm } from '../useExpenseForm';

import { createVendorFromExpenseFlowMutation } from './mutations';

type CreateVendorPayeeFormProps = {
  isSubmitting: ExpenseForm['isSubmitting'];
  host: ExpenseForm['options']['host'];
  isBeneficiary?: boolean;
  onSuccess: (vendor: { slug: string }) => void;
};

const getCreateVendorSchema = (requiredMessage: string) =>
  z.object({
    name: z.string().trim().min(1, requiredMessage).max(255),
    legalName: z.preprocess(val => (val === '' ? undefined : val), z.string().max(255).optional()),
  });

type VendorFormValues = z.infer<ReturnType<typeof getCreateVendorSchema>>;

const initialFormValues: VendorFormValues = {
  name: '',
};

export function CreateVendorPayeeForm(props: CreateVendorPayeeFormProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const [createVendor, { loading }] = useMutation(createVendorFromExpenseFlowMutation);

  const requiredMessage = intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' });
  const schema = React.useMemo(() => getCreateVendorSchema(requiredMessage), [requiredMessage]);

  const { host, isBeneficiary, onSuccess } = props;
  const onSubmit = React.useCallback(
    async (values: VendorFormValues) => {
      try {
        const result = await createVendor({
          variables: {
            host: { id: host.id },
            vendor: {
              name: values.name,
              legalName: values.legalName,
            },
          },
        });
        const newVendor = result.data?.createVendor;
        if (newVendor?.slug) {
          toast({
            variant: 'success',
            message: isBeneficiary
              ? intl.formatMessage({ defaultMessage: 'Beneficiary Created', id: 'm9s72m' })
              : intl.formatMessage({ defaultMessage: 'Vendor created', id: 'RqFmBj' }),
          });
          onSuccess(newVendor);
        }
      } catch (error) {
        const gqlError = getErrorFromGraphqlException(error);
        toast({ variant: 'error', message: formatErrorMessage(intl, gqlError) });
      }
    },
    [createVendor, host, isBeneficiary, intl, onSuccess, toast],
  );

  return (
    <FormikZod<VendorFormValues> schema={schema} initialValues={initialFormValues} onSubmit={onSubmit}>
      <CreateVendorFormFields
        isDisabled={props.isSubmitting || loading}
        mutationLoading={loading}
        isBeneficiary={isBeneficiary}
      />
    </FormikZod>
  );
}

function CreateVendorFormFields(props: { isDisabled: boolean; mutationLoading: boolean; isBeneficiary?: boolean }) {
  const intl = useIntl();
  const form = useFormikContext<VendorFormValues>();
  const { isDisabled, isBeneficiary } = props;

  return (
    <div className="flex flex-col gap-4">
      <FormField
        name="name"
        disabled={isDisabled}
        hint={intl.formatMessage({
          defaultMessage: 'Displayed publicly. Can be different from legal name.',
          id: 'publicName.hint',
        })}
        label={
          isBeneficiary
            ? intl.formatMessage({ defaultMessage: "Beneficiary's name", id: '9voqSP' })
            : intl.formatMessage({ defaultMessage: "Vendor's name", id: 'iDPmhB' })
        }
        placeholder={intl.formatMessage({ defaultMessage: 'e.g. Green Horizon', id: 'HkMITl' })}
      />

      <FormField
        name="legalName"
        disabled={isDisabled}
        hint={intl.formatMessage({
          defaultMessage:
            'Official name as registered with legal authorities. Used to render invoice and for tax purposes.',
          id: '/noqea',
        })}
        label={
          isBeneficiary
            ? intl.formatMessage({ defaultMessage: "Beneficiary's legal name", id: 'GFYFG/' })
            : intl.formatMessage({ defaultMessage: "Vendor's legal name", id: '+5Vgek' })
        }
        placeholder={intl.formatMessage({
          defaultMessage: 'e.g. Green Horizon Foundation, Inc.',
          id: 'PhnLMX',
        })}
        required={false}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          disabled={isDisabled || !form.isValid}
          loading={props.mutationLoading}
          onClick={() => form.submitForm()}
          className="flex-1"
        >
          {isBeneficiary ? (
            <FormattedMessage defaultMessage="Create beneficiary" id="rwEWZ6" />
          ) : (
            <FormattedMessage defaultMessage="Create Vendor" id="I5p2+k" />
          )}
        </Button>
      </div>
    </div>
  );
}
