import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { AccountingCategory } from '../../../../lib/graphql/types/v2/schema';
import { AccountingCategoryAppliesTo, AccountingCategoryKind } from '../../../../lib/graphql/types/v2/schema';

import { Button } from '@/components/ui/Button';

import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../../StyledModal';

import type { EditableAccountingCategoryFields } from './AccountingCategoryForm';
import {
  AccountingCategoryAppliesToI18n,
  AccountingCategoryForm,
  AccountingCategoryKindI18n,
  useAccountingCategoryFormik,
} from './AccountingCategoryForm';

type CreateAccountingCategoryModalProps = {
  onClose: () => void;
  onCreate: (category: Pick<AccountingCategory, EditableAccountingCategoryFields>) => Promise<void>;
  isIndependentCollective: boolean;
};

export function CreateAccountingCategoryModal(props: CreateAccountingCategoryModalProps) {
  const intl = useIntl();
  const { onCreate } = props;
  const createAccountingCategory = React.useCallback(
    async (values: Pick<AccountingCategory, EditableAccountingCategoryFields>) => {
      await onCreate(values);
    },
    [onCreate],
  );

  const defaultAppliesTo = props.isIndependentCollective ? AccountingCategoryAppliesTo.HOST : null;

  const formik = useAccountingCategoryFormik({
    initialValues: {
      name: '',
      friendlyName: '',
      code: '',
      kind: {
        value: AccountingCategoryKind.EXPENSE,
        label: intl.formatMessage(AccountingCategoryKindI18n[AccountingCategoryKind.EXPENSE]),
      },
      expensesTypes: null,
      hostOnly: {
        value: false,
        label: intl.formatMessage({ defaultMessage: 'No', id: 'oUWADl' }),
      },
      appliesTo: {
        value: defaultAppliesTo,
        label: intl.formatMessage(AccountingCategoryAppliesToI18n[defaultAppliesTo || 'ALL']),
      },
    },
    async onSubmit(values) {
      await createAccountingCategory({
        ...values,
        hostOnly: values.hostOnly.value,
        kind: values.kind ? values.kind.value : null,
        expensesTypes:
          values.expensesTypes && values.expensesTypes.length > 0 ? values.expensesTypes.map(t => t.value) : null,
        appliesTo: values.appliesTo
          ? values.appliesTo.value
          : props.isIndependentCollective
            ? AccountingCategoryAppliesTo.HOST
            : AccountingCategoryAppliesTo.HOSTED_COLLECTIVES,
      });
    },
  });

  return (
    <StyledModal onClose={props.onClose} hasUnsavedChanges={formik.dirty}>
      <ModalHeader>
        <FormattedMessage defaultMessage="Create accounting category" id="M+dnU9" />
      </ModalHeader>
      <ModalBody>
        <AccountingCategoryForm formik={formik} isIndependentCollective={props.isIndependentCollective} />
      </ModalBody>
      <ModalFooter showDivider={false}>
        <form onSubmit={e => formik.handleSubmit(e)}>
          <div className="flex justify-end gap-4 border-t-1 border-solid border-t-slate-100 pt-4">
            <Button onClick={props.onClose} variant="outline">
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </Button>
            <Button type="submit" data-cy="create-category-button">
              <FormattedMessage defaultMessage="Create category" id="ZROXxK" />
            </Button>
          </div>
        </form>
      </ModalFooter>
    </StyledModal>
  );
}
