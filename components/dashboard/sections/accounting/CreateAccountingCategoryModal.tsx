import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AccountingCategory, AccountingCategoryKind } from '../../../../lib/graphql/types/v2/graphql';

import StyledButton from '../../../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../../StyledModal';

import {
  AccountingCategoryForm,
  AccountingCategoryKindI18n,
  EditableAccountingCategoryFields,
  useAccountingCategoryFormik,
} from './AccountingCategoryForm';

type CreateAccountingCategoryModalProps = {
  onClose: () => void;
  onCreate: (category: Pick<AccountingCategory, EditableAccountingCategoryFields>) => Promise<void>;
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
        label: intl.formatMessage({ defaultMessage: 'No' }),
      },
    },
    async onSubmit(values) {
      await createAccountingCategory({
        ...values,
        hostOnly: values.hostOnly.value,
        kind: values.kind ? values.kind.value : null,
        expensesTypes:
          values.expensesTypes && values.expensesTypes.length > 0 ? values.expensesTypes.map(t => t.value) : null,
      });
    },
  });

  return (
    <StyledModal onClose={props.onClose} hasUnsavedChanges={formik.dirty}>
      <ModalHeader>
        <FormattedMessage defaultMessage="Create accounting category" />
      </ModalHeader>
      <ModalBody>
        <AccountingCategoryForm formik={formik} />
      </ModalBody>
      <ModalFooter showDivider={false}>
        <form onSubmit={e => formik.handleSubmit(e)}>
          <div className="flex justify-center gap-4">
            <StyledButton type="submit" buttonStyle="primary">
              <FormattedMessage defaultMessage="Create category" />
            </StyledButton>
            <StyledButton onClick={props.onClose}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
          </div>
        </form>
      </ModalFooter>
    </StyledModal>
  );
}
