import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AccountingCategory, AccountingCategoryKind } from '../../../../lib/graphql/types/v2/graphql';

import StyledButton from '../../../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../../StyledModal';

import {
  AccountingCategoryForm,
  AccountingCategoryKindI18n,
  useAccoutingCategoryFormik,
} from './AccountingCategoryForm';

type CreateAccountingCategoryModalProps = {
  onClose: () => void;
  onCreate: (category: Pick<AccountingCategory, 'name' | 'friendlyName' | 'code' | 'expensesTypes'>) => Promise<void>;
};

export function CreateAccountingCategoryModal(props: CreateAccountingCategoryModalProps) {
  const intl = useIntl();
  const { onCreate } = props;
  const createFundCategoryPicker = React.useCallback(
    async (values: Pick<AccountingCategory, 'kind' | 'name' | 'friendlyName' | 'code' | 'expensesTypes'>) => {
      await onCreate(values);
    },
    [onCreate],
  );

  const formik = useAccoutingCategoryFormik({
    initialValues: {
      name: '',
      friendlyName: '',
      code: '',
      kind: {
        value: AccountingCategoryKind.EXPENSE,
        label: intl.formatMessage(AccountingCategoryKindI18n[AccountingCategoryKind.EXPENSE]),
      },
      expensesTypes: null,
    },
    async onSubmit(values) {
      await createFundCategoryPicker({
        ...values,
        kind: values.kind ? values.kind.value : null,
        expensesTypes:
          values.expensesTypes && values.expensesTypes.length > 0 ? values.expensesTypes.map(t => t.value) : null,
      });
    },
  });

  return (
    <StyledModal onClose={props.onClose}>
      <form onSubmit={e => formik.handleSubmit(e)}>
        <ModalHeader>
          <FormattedMessage defaultMessage="Create accounting category" />
        </ModalHeader>
        <ModalBody>
          <AccountingCategoryForm formik={formik} />
        </ModalBody>
        <ModalFooter showDivider={false}>
          <div className="flex justify-center gap-4">
            <StyledButton type="submit" buttonStyle="primary">
              <FormattedMessage defaultMessage="Create category" />
            </StyledButton>
            <StyledButton onClick={props.onClose}>
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
          </div>
        </ModalFooter>
      </form>
    </StyledModal>
  );
}
