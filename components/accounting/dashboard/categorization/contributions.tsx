import { PredicateValueInputAccount } from './input/PredicateValueInputAccount';
import { PredicateValueInputAccountType } from './input/PredicateValueInputAccountType';
import { PredicateValueInputAmount } from './input/PredicateValueInputAmount';
import { PredicateValueInputCurrency } from './input/PredicateValueInputCurrency';
import { PredicateValueInputFrequency } from './input/PredicateValueInputFrequency';
import { PredicateValueInputPaymentProcessor } from './input/PredicateValueInputPaymentProcessor';
import { PredicateValueInputText } from './input/PredicateValueInputText';
import { PredicateValueInputTierType } from './input/PredicateValueInputTierType';
import type { PredicateInputProps } from './input/types';
import { Op } from './rules';

export enum ContributionField {
  description = 'description',
  amount = 'amount',
  currency = 'currency',
  frequency = 'frequency',
  toAccount = 'toAccount',
  toAccountType = 'toAccountType',
  fromAccountType = 'fromAccountType',
  tierType = 'tierType',
  paymentProcessor = 'paymentProcessor',
}

export const ContributionSubjectDefinitions: Record<
  ContributionField,
  { label: string; operators: Op[]; InputComponent: React.ComponentType<PredicateInputProps> }
> = {
  [ContributionField.description]: {
    label: 'Description',
    operators: [Op.contains],
    InputComponent: PredicateValueInputText,
  },
  [ContributionField.amount]: {
    label: 'Amount',
    operators: [Op.eq, Op.gte, Op.lte],
    InputComponent: PredicateValueInputAmount,
  },
  [ContributionField.currency]: {
    label: 'Currency',
    operators: [Op.eq],
    InputComponent: PredicateValueInputCurrency,
  },
  [ContributionField.frequency]: {
    label: 'Frequency',
    operators: [Op.eq, Op.in],
    InputComponent: PredicateValueInputFrequency,
  },
  [ContributionField.toAccount]: {
    label: 'To Account',
    operators: [Op.eq, Op.in],
    InputComponent: PredicateValueInputAccount,
  },
  [ContributionField.toAccountType]: {
    label: 'To Account Type',
    operators: [Op.eq, Op.in],
    InputComponent: PredicateValueInputAccountType,
  },
  [ContributionField.fromAccountType]: {
    label: 'From Account Type',
    operators: [Op.eq, Op.in],
    InputComponent: PredicateValueInputAccountType,
  },
  [ContributionField.tierType]: {
    label: 'Tier Type',
    operators: [Op.eq, Op.in],
    InputComponent: PredicateValueInputTierType,
  },
  [ContributionField.paymentProcessor]: {
    label: 'Payment Processor',
    operators: [Op.eq, Op.in],
    InputComponent: PredicateValueInputPaymentProcessor,
  },
} as const;

export type ContributionPredicate = {
  subject: ContributionField;
  operator: Op;
  value: string | number | string[] | null;
};

export type ContributionCategorizationRule = {
  predicates: ContributionPredicate[];
  categoryId: string;
  name: string;
  enabled: boolean;
  order: number;
  id?: string;
};
