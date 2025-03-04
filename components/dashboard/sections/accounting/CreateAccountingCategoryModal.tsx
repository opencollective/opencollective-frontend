import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { AccountingCategory } from '../../../../lib/graphql/types/v2/schema';
import { AccountingCategoryAppliesTo, AccountingCategoryKind } from '../../../../lib/graphql/types/v2/schema';

import StyledButton from '../../../StyledButton';
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
          <div className="flex justify-center gap-4">
            <StyledButton type="submit" buttonStyle="primary">
              <FormattedMessage defaultMessage="Create category" id="ZROXxK" />
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
