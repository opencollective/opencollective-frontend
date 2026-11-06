/**
 * Form actions: the mutations that sections of the Expense form trigger. Each action owns
 * mutate → resync → select, so sections only keep presentation.
 *
 * The resync strategy is a targeted refetch: once the mutation succeeded, the caller's `resync`
 * reloads the data the form shows (for the Expense form, its form query) before the result is
 * selected. There is no fixed delay.
 */
import React from 'react';
import { gql, useMutation } from '@apollo/client';

import type {
  CreateOrganizationFromExpenseFlowMutation,
  CreateOrganizationFromExpenseFlowMutationVariables,
  EditPayoutMethodMutation,
  EditPayoutMethodMutationVariables,
  OrganizationCreateInput,
  PayoutMethodInput,
  SavePayoutMethodMutation,
  SavePayoutMethodMutationVariables,
} from '../../lib/graphql/types/v2/graphql';

import {
  createOrganizationFromExpenseFlowMutation,
  updateAccountLegalNameMutation,
  updateAccountUSEntityMutation,
} from './form/mutations';

const savePayoutMethodMutation = gql`
  mutation SavePayoutMethod($payoutMethod: PayoutMethodInput!, $payeeSlug: String!) {
    createPayoutMethod(payoutMethod: $payoutMethod, account: { slug: $payeeSlug }) {
      id
    }
  }
`;

const editPayoutMethodMutation = gql`
  mutation EditPayoutMethod($payoutMethod: PayoutMethodInput!) {
    editPayoutMethod(payoutMethod: $payoutMethod) {
      id
      name
      data
      isSaved
      type
    }
  }
`;

const deletePayoutMethodMutation = gql`
  mutation DeletePayoutMethod($payoutMethodId: String!) {
    removePayoutMethod(payoutMethodId: $payoutMethodId) {
      id
    }
  }
`;

export type ExpenseFormActions = {
  /**
   * Creates a payout method (when it has no ID) or edits it, then selects it.
   * @param accountSlug The account owning the new payout method (the payee, or its Host for cross-host payees)
   */
  savePayoutMethod: (payoutMethod: PayoutMethodInput, opts?: { accountSlug?: string }) => Promise<string>;
  /** Selects a payout method that was connected outside the form (e.g. PayPal Connect) */
  selectConnectedPayoutMethod: (payoutMethodId: string) => Promise<void>;
  removePayoutMethod: (payoutMethodId: string) => Promise<void>;
  /** Creates an Organization to get paid as, then selects it as the payee */
  createPayeeOrganization: (
    organization: OrganizationCreateInput,
  ) => Promise<CreateOrganizationFromExpenseFlowMutation['createOrganization']>;
  updateLegalName: (accountId: string, legalName: string) => Promise<void>;
  updateUSEntityStatus: (accountId: string, isUSEntity: boolean) => Promise<void>;
};

type ExpenseFormActionsConfig = {
  /** Reloads the data shown by the form */
  resync: () => Promise<unknown> | unknown;
  /** The account a new payout method belongs to, when not given to `savePayoutMethod` */
  defaultPayoutMethodAccountSlug?: string;
  onPayoutMethodSaved?: (payoutMethodId: string, opts: { isNew: boolean }) => void;
  onPayoutMethodRemoved?: (payoutMethodId: string) => void;
  onPayeeOrganizationCreated?: (organization: CreateOrganizationFromExpenseFlowMutation['createOrganization']) => void;
  /** Called before resyncing when an Organization was created, since the submitter's profiles changed */
  onProfilesChanged?: () => Promise<unknown> | unknown;
};

export function useExpenseFormActions(config: ExpenseFormActionsConfig): ExpenseFormActions {
  const [createPayoutMethod] = useMutation<SavePayoutMethodMutation, SavePayoutMethodMutationVariables>(
    savePayoutMethodMutation,
  );
  const [editPayoutMethod] = useMutation<EditPayoutMethodMutation, EditPayoutMethodMutationVariables>(
    editPayoutMethodMutation,
  );
  const [deletePayoutMethod] = useMutation(deletePayoutMethodMutation);
  const [createOrganization] = useMutation<
    CreateOrganizationFromExpenseFlowMutation,
    CreateOrganizationFromExpenseFlowMutationVariables
  >(createOrganizationFromExpenseFlowMutation);
  const [updateLegalNameMutation] = useMutation(updateAccountLegalNameMutation);
  const [updateUSEntityMutation] = useMutation(updateAccountUSEntityMutation);

  // Callbacks read the latest config, so the actions keep a stable identity
  const configRef = React.useRef(config);
  configRef.current = config;

  return React.useMemo<ExpenseFormActions>(
    () => ({
      savePayoutMethod: async (payoutMethod, opts = {}) => {
        const { resync, onPayoutMethodSaved, defaultPayoutMethodAccountSlug } = configRef.current;
        let payoutMethodId: string;
        const isNew = !payoutMethod.id;
        if (isNew) {
          const response = await createPayoutMethod({
            variables: { payoutMethod, payeeSlug: opts.accountSlug ?? defaultPayoutMethodAccountSlug },
          });
          payoutMethodId = response.data.createPayoutMethod.id;
        } else {
          const response = await editPayoutMethod({ variables: { payoutMethod } });
          payoutMethodId = response.data.editPayoutMethod.id;
        }

        await resync();
        onPayoutMethodSaved?.(payoutMethodId, { isNew });
        return payoutMethodId;
      },
      selectConnectedPayoutMethod: async payoutMethodId => {
        const { resync, onPayoutMethodSaved } = configRef.current;
        await resync();
        onPayoutMethodSaved?.(payoutMethodId, { isNew: true });
      },
      removePayoutMethod: async payoutMethodId => {
        await deletePayoutMethod({ variables: { payoutMethodId } });
        const { resync, onPayoutMethodRemoved } = configRef.current;
        onPayoutMethodRemoved?.(payoutMethodId);
        await resync();
      },
      createPayeeOrganization: async organization => {
        const result = await createOrganization({ variables: { organization } });
        const newOrganization = result.data?.createOrganization;
        const { resync, onProfilesChanged, onPayeeOrganizationCreated } = configRef.current;
        await onProfilesChanged?.();
        await resync();
        onPayeeOrganizationCreated?.(newOrganization);
        return newOrganization;
      },
      updateLegalName: async (accountId, legalName) => {
        await updateLegalNameMutation({ variables: { account: { id: accountId, legalName } } });
        await configRef.current.resync();
      },
      updateUSEntityStatus: async (accountId, isUSEntity) => {
        await updateUSEntityMutation({ variables: { account: { id: accountId, isUSEntity } } });
        await configRef.current.resync();
      },
    }),
    [
      createPayoutMethod,
      editPayoutMethod,
      deletePayoutMethod,
      createOrganization,
      updateLegalNameMutation,
      updateUSEntityMutation,
    ],
  );
}
