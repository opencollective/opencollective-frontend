import React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/utils';

import type { ExpenseForm } from './useExpenseForm';

export type SubmitExpenseFlowStepsProps = {
  className?: string;
  completedSteps?: Step[];
  activeStep: Step;
  expenseForm: ExpenseForm;
};

const stepListItemVariants = cva('', {
  variants: {
    itemType: {
      header:
        '[--step-bullet-border-color:#94A3B8] [--step-bullet-border-width:2px] [--step-bullet-border:2px] [--step-bullet-color:white] [--step-bullet-size:24px] [--step-bullet-text-color:#48566A] after:hidden',
      activeHeader:
        '[--step-bullet-border-color:#1547B8] [--step-bullet-border-width:2px] [--step-bullet-color:white] [--step-bullet-size:24px] [--step-line-color:#1547B8]',
      completedHeader:
        "[--step-bullet-border-color:#1547B8] [--step-bullet-border-width:2px] [--step-bullet-color:#1547B8] [--step-bullet-size:24px] [--step-bullet-text-color:white] [--step-line-color:#1547B8] before:content-['✓']",
      activeItem:
        '[--step-bullet-box-shadow:0_0_0_4px_hsla(216,_100%,_58%,_0.3)] [--step-bullet-color:#1547B8] [--step-text-color:#1547B8]',
      completedItem: '[--step-bullet-color:#1547B8] [--step-line-color:#1547B8]',
      item: '',
    },
  },
  defaultVariants: {
    itemType: 'item',
  },
});

export enum Step {
  WHO_IS_PAYING = 'WHO_IS_PAYING',
  WHO_IS_GETTING_PAID = 'WHO_IS_GETTING_PAID',
  PAYOUT_METHOD = 'PAYOUT_METHOD',
  TYPE_OF_EXPENSE = 'TYPE_OF_EXPENSE',
  EXPENSE_CATEGORY = 'EXPENSE_CATEGORY',
  EXPENSE_ITEMS = 'EXPENSE_ITEMS',
  EXPENSE_TITLE = 'EXPENSE_TITLE',
  SUMMARY = 'SUMMARY',
}

export function SubmitExpenseFlowSteps(props: SubmitExpenseFlowStepsProps) {
  const completedSteps = props.completedSteps || [];
  return (
    <div className={cn(props.className)}>
      <ol className="pl-[12px] [--step-bullet-border-color:#CBD5E1] [--step-bullet-border-width:0px] [--step-bullet-color:#CBD5E1] [--step-bullet-size:8px] [--step-line-color:#E1E7EF] [--step-text-color:#344256] *:relative *:flex *:items-center *:gap-2 *:pb-8 *:pl-7 *:text-base *:font-bold *:text-[var(--step-text-color)] *:before:absolute *:before:left-0 *:before:inline-block *:before:h-[var(--step-bullet-size)] *:before:w-[var(--step-bullet-size)] *:before:-translate-x-[calc(var(--step-bullet-size)/2)] *:before:rounded-full *:before:border-[var(--step-bullet-border-color)] *:before:bg-[--step-bullet-color] *:before:text-center *:before:text-sm *:before:font-medium *:before:text-[var(--step-bullet-text-color,var(--step-bullet-border-color))] *:before:[border-width:var(--step-bullet-border-width)] *:before:[box-shadow:var(--step-bullet-box-shadow,initial)] *:after:absolute *:after:left-0 *:after:top-2 *:after:-z-10 *:after:h-full *:after:-translate-x-[1px] *:after:border-l-2 *:after:border-[--step-line-color] *:after:[border-style:var(--step-line-style,solid)]">
        <li
          className={cn(
            "before:content-['1']",
            stepListItemVariants({ itemType: props.activeStep === Step.SUMMARY ? 'completedHeader' : 'activeHeader' }),
          )}
        >
          Expense Details
        </li>
        {props.activeStep !== Step.SUMMARY && (
          <React.Fragment>
            <li
              className={cn(
                stepListItemVariants({
                  itemType:
                    props.activeStep === Step.WHO_IS_PAYING
                      ? 'activeItem'
                      : completedSteps.includes(Step.WHO_IS_PAYING)
                        ? 'completedItem'
                        : 'item',
                }),
              )}
            >
              Who is paying?
            </li>
            <li
              className={cn(
                stepListItemVariants({
                  itemType: props.activeStep === Step.WHO_IS_GETTING_PAID ? 'activeItem' : 'item',
                }),
              )}
            >
              Who is getting paid?
            </li>
            <li
              className={cn(
                stepListItemVariants({ itemType: props.activeStep === Step.PAYOUT_METHOD ? 'activeItem' : 'item' }),
              )}
            >
              Payout Method
            </li>
            <li
              className={cn(
                stepListItemVariants({ itemType: props.activeStep === Step.TYPE_OF_EXPENSE ? 'activeItem' : 'item' }),
              )}
            >
              Type of expense
            </li>
            <li
              className={cn(
                stepListItemVariants({ itemType: props.activeStep === Step.EXPENSE_CATEGORY ? 'activeItem' : 'item' }),
              )}
            >
              Expense Category
            </li>
            <li
              className={cn(
                stepListItemVariants({ itemType: props.activeStep === Step.EXPENSE_ITEMS ? 'activeItem' : 'item' }),
              )}
            >
              Expense items
            </li>
            <li
              className={cn(
                stepListItemVariants({ itemType: props.activeStep === Step.EXPENSE_TITLE ? 'activeItem' : 'item' }),
              )}
            >
              Expense Title
            </li>
          </React.Fragment>
        )}
        <li
          className={cn(
            "before:content-['2'] [--step-line-style:none]",
            stepListItemVariants({ itemType: props.activeStep === Step.SUMMARY ? 'activeHeader' : 'header' }),
          )}
        >
          Summary
        </li>
      </ol>
    </div>
  );
}
