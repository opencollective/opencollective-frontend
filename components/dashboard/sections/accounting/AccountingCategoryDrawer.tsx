import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AccountingCategory, AccountingCategoryKind } from '../../../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../../../lib/i18n/expense';

import { Drawer, DrawerActions, DrawerHeader } from '../../../Drawer';
import HTMLContent, { isEmptyHTMLValue } from '../../../HTMLContent';
import StyledButton from '../../../StyledButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';

import {
  AccountingCategoryForm,
  AccountingCategoryKindI18n,
  EditableAccountingCategoryFields,
  useAccountingCategoryFormik,
} from './AccountingCategoryForm';

type AccountingCategoryDrawerProps = {
  open: boolean;
  onClose: () => void;
  onEdit: (category: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>) => void;
  onDelete: (category: Pick<AccountingCategory, 'id'>) => void;
  accountingCategory?: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>;
};

export function AccountingCategoryDrawer(props: AccountingCategoryDrawerProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (!props.open) {
      setIsEditing(false);
    }
  }, [props.open]);

  return (
    <Drawer maxWidth="512px" open={props.open} onClose={props.onClose} showActionsContainer>
      <DrawerHeader title={props.accountingCategory?.name} onClose={props.onClose} />

      {!isEditing && (
        <AccountingCategoryDrawerView
          onEditClick={() => setIsEditing(true)}
          onDeleteClick={() => props.onDelete(props.accountingCategory)}
          accountingCategory={props.accountingCategory}
        />
      )}
      {isEditing && (
        <AccountingCategoryEditingDrawerView
          accountingCategory={props.accountingCategory}
          onEdit={props.onEdit}
          onExitEdit={() => setIsEditing(false)}
        />
      )}
    </Drawer>
  );
}

type AccountingCategoryDrawerViewProps = {
  accountingCategory?: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>;
  onEditClick: () => void;
  onDeleteClick: () => void;
};

function AccountingCategoryDrawerView(props: AccountingCategoryDrawerViewProps) {
  const intl = useIntl();
  return (
    <React.Fragment>
      <div>
        <label className="mb-1 text-base">
          <FormattedMessage defaultMessage="Applies to" id="6WqHWi" />
        </label>
        <p>
          {props.accountingCategory?.kind && (
            <FormattedMessage {...AccountingCategoryKindI18n[props.accountingCategory?.kind]} />
          )}
        </p>
        <label className="mb-1 mt-4 text-base">
          <FormattedMessage defaultMessage="Host only" id="qj+AAT" />
        </label>
        <p>
          {props.accountingCategory?.hostOnly ? (
            <FormattedMessage defaultMessage="Yes" id="a5msuh" />
          ) : (
            <FormattedMessage defaultMessage="No" id="oUWADl" />
          )}
        </p>
        <label className="mb-1 mt-4 text-base">
          <FormattedMessage defaultMessage="Category name" id="kgVqk1" />
        </label>
        <p>{props.accountingCategory?.name}</p>

        {props.accountingCategory?.friendlyName && (
          <React.Fragment>
            <label className="mb-1 mt-4 text-base">
              <FormattedMessage id="AccountingCategory.friendlyName" defaultMessage="Friendly name" />
            </label>
            <p className="italic">{props.accountingCategory?.friendlyName}</p>
          </React.Fragment>
        )}

        <label className="mb-1 mt-4 text-base">
          <FormattedMessage defaultMessage="Accounting code" id="tvVFNA" />
        </label>

        <p>
          <span className="inline-block rounded-xl bg-slate-50 px-2 py-1 font-bold text-slate-800">
            {props.accountingCategory?.code}
          </span>
        </p>

        {props.accountingCategory?.kind === AccountingCategoryKind.EXPENSE && (
          <React.Fragment>
            <label className="mb-1 mt-4 text-base">
              <FormattedMessage defaultMessage="Expense types" id="7oAuzt" />
            </label>
            <p>
              {props.accountingCategory?.expensesTypes ? (
                props.accountingCategory.expensesTypes.map(value => i18nExpenseType(intl, value)).join(', ')
              ) : (
                <FormattedMessage id="AllExpenses" defaultMessage="All expenses" />
              )}
            </p>
          </React.Fragment>
        )}

        {!isEmptyHTMLValue(props.accountingCategory?.instructions) && (
          <React.Fragment>
            <label className="mb-1 mt-4 text-base">
              <FormattedMessage defaultMessage="Instructions" id="sV2v5L" />
            </label>
            <div>
              <HTMLContent content={props.accountingCategory?.instructions} />
            </div>
          </React.Fragment>
        )}
      </div>
      <DrawerActions>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <StyledButton>
              <FormattedMessage defaultMessage="More actions" id="S8/4ZI" />
            </StyledButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <React.Fragment>
              <DropdownMenuItem className="cursor-pointer text-red-500" onClick={props.onDeleteClick}>
                <FormattedMessage id="actions.delete" defaultMessage="Delete" />
              </DropdownMenuItem>
            </React.Fragment>
          </DropdownMenuContent>
        </DropdownMenu>

        <StyledButton buttonStyle="secondary" onClick={props.onEditClick}>
          <FormattedMessage defaultMessage="Edit category" id="1mQAJl" />
        </StyledButton>
      </DrawerActions>
    </React.Fragment>
  );
}

type AccountingCategoryEditingDrawerViewProps = {
  accountingCategory?: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>;
  onEdit: (category: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>) => void;
  onExitEdit: () => void;
};

function AccountingCategoryEditingDrawerView(props: AccountingCategoryEditingDrawerViewProps) {
  const intl = useIntl();

  const initialValues = React.useMemo(() => {
    return {
      name: props.accountingCategory?.name,
      friendlyName: props.accountingCategory?.friendlyName,
      code: props.accountingCategory?.code,
      kind: {
        value: props.accountingCategory?.kind ?? AccountingCategoryKind.EXPENSE,
        label: intl.formatMessage(
          AccountingCategoryKindI18n[props.accountingCategory?.kind || AccountingCategoryKind.EXPENSE],
        ),
      },
      hostOnly: {
        value: props.accountingCategory?.hostOnly,
        label: props.accountingCategory?.hostOnly
          ? intl.formatMessage({ defaultMessage: 'Yes', id: 'a5msuh' })
          : intl.formatMessage({ defaultMessage: 'No', id: 'oUWADl' }),
      },
      instructions: props.accountingCategory?.instructions,
      expensesTypes: props.accountingCategory?.expensesTypes
        ? props.accountingCategory?.expensesTypes.map(t => ({ value: t, label: i18nExpenseType(intl, t) }))
        : null,
    };
  }, [props.accountingCategory, intl]);

  const formik = useAccountingCategoryFormik({
    initialValues,
    async onSubmit(values) {
      try {
        await props.onEdit({
          ...values,
          id: props.accountingCategory?.id,
          kind: values.kind ? values.kind.value : null,
          hostOnly: values.hostOnly.value,
          instructions: values.instructions,
          expensesTypes:
            values.expensesTypes && values.expensesTypes.length > 0 ? values.expensesTypes.map(t => t.value) : null,
        });
        props.onExitEdit();
      } catch (e) {
        // toast handled by onEdit
      }
    },
  });
  return (
    <React.Fragment>
      <AccountingCategoryForm formik={formik} />
      <DrawerActions>
        <StyledButton onClick={props.onExitEdit}>
          <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
        </StyledButton>
        <StyledButton buttonStyle="secondary" onClick={formik.submitForm} loading={formik.isSubmitting} minWidth={135}>
          <FormattedMessage id="save" defaultMessage="Save" />
        </StyledButton>
      </DrawerActions>
    </React.Fragment>
  );
}
