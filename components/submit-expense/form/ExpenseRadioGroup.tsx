import React, { Children } from 'react';
import { cva } from 'class-variance-authority';
import { ChevronsUpDown } from 'lucide-react';
import type { BaseSyntheticEvent } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../../lib/utils';

const radioGroupVariants = cva('cursor-pointer', {
  variants: {
    variant: {
      tab: 'flex w-max gap-1 rounded bg-[#F1F5F9] p-1',
      vertical: 'flex w-full flex-col gap-2',
      select: 'max-h-64 overflow-y-auto',
      block: 'flex gap-4',
    },
  },
  defaultVariants: {
    variant: 'tab',
  },
});

const radioGroupLabelVariants = cva(
  'flex cursor-pointer flex-col justify-center text-sm font-medium has-[:disabled]:cursor-default',
  {
    variants: {
      variant: {
        // tab: '',
        tab: 'has-[:checked]:bg-[#F1F5F9]:hover rounded px-4 py-2 hover:bg-white has-[:checked]:bg-white has-[:checked]:text-[#184090] has-[:disabled]:text-gray-500 has-[:checked]:[box-shadow:0px_1px_1px_0px_#00000017,0px_2px_1px_0px_#0000000D,0px_3px_1px_0px_#00000003,_0px_5px_1px_0px_#00000000] has-[:disabled]:hover:bg-[#F1F5F9]',
        vertical:
          'relative w-full items-center py-4 pl-[48px] pr-4 before:absolute before:left-[16px] before:block before:h-4 before:w-4 before:rounded-full before:border before:border-[#CBD5E1] hover:before:border-[#1869F5] hover:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset] has-[:checked]:before:border-[#1869F5] has-[:checked]:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset]',
        select: 'w-full',
        block:
          'relative font-normal h-full justify-start py-3 pl-[48px] pr-4 before:translate-y-2 before:absolute before:left-[16px] before:block before:h-4 before:w-4 before:rounded-full before:border before:border-[#CBD5E1] hover:before:border-[#1869F5] hover:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset] has-[:checked]:before:border-[#1869F5] has-[:checked]:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset]',
        // select:
        // 'relative flex w-full items-center px-[48px] py-4 before:absolute before:left-[16px] before:block before:h-4 before:w-4 before:rounded-full before:border before:border-[#CBD5E1] hover:before:border-[#1869F5] hover:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset] has-[:checked]:before:border-[#1869F5] has-[:checked]:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset]',
      },
    },
    defaultVariants: {
      variant: 'tab',
    },
  },
);

const radioGroupItemVariants = cva('cursor-pointer text-sm font-medium has-[:disabled]:cursor-default', {
  variants: {
    variant: {
      tab: '',
      // tab: 'has-[:checked]:bg-[#F1F5F9]:hover rounded px-4 py-2 hover:bg-white has-[:checked]:bg-white has-[:checked]:text-[#184090] has-[:disabled]:text-gray-500 has-[:checked]:[box-shadow:0px_1px_1px_0px_#00000017,0px_2px_1px_0px_#0000000D,0px_3px_1px_0px_#00000003,_0px_5px_1px_0px_#00000000] has-[:disabled]:hover:bg-[#F1F5F9]',
      // vertical:
      // 'relative flex w-full items-center rounded-md border border-[#DCDDE0] py-4 pl-[48px] pr-4 before:absolute before:left-[16px] before:block before:h-4 before:w-4 before:rounded-full before:border before:border-[#CBD5E1] hover:before:border-[#1869F5] hover:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset] has-[:checked]:before:border-[#1869F5] has-[:checked]:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset]',
      vertical: 'w-full rounded-md border border-[#DCDDE0]',
      select:
        'relative flex w-full items-center px-[48px] py-2 before:absolute before:left-[16px] before:block before:h-4 before:w-4 before:rounded-full before:border before:border-[#CBD5E1] hover:before:border-[#1869F5] hover:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset] has-[:checked]:before:border-[#1869F5] has-[:checked]:before:[box-shadow:0px_0px_0px_4px_#1869F5_inset]',
      block: 'relative flex-grow basis-0 rounded-md border border-[#DCDDE0]',
    },
  },
  defaultVariants: {
    variant: 'tab',
  },
});

type ExpenseRadioGroupItemProps<ValueType extends string> = {
  value: ValueType;
  name: string;
  checked: boolean;
  disabled?: boolean;
  variant?: Parameters<typeof radioGroupItemVariants>[0]['variant'];
  expandedContent?: React.ReactNode;
  children: React.ReactNode;
  ButtonLabelPortal: Portal;
  toggleIsOpen: () => void;
};

function ExpenseRadioGroupItem<ValueType extends string = string>(props: ExpenseRadioGroupItemProps<ValueType>) {
  const id = `${props.name}-${props.value}`;

  const [LabelPortal, setLabelPortal] = React.useState<Portal>(() => () => null);
  const onLabelRef = React.useCallback(ref => setLabelPortal(() => createPortalComponent(ref)), []);
  const [ExpandedContentPortal, setExpandedContentPortal] = React.useState<Portal>(() => () => null);
  const onExpandedContentRef = React.useCallback(ref => setExpandedContentPortal(() => createPortalComponent(ref)), []);

  return (
    <OptionContext.Provider
      value={{
        LabelPortal,
        ExpandedContentPortal,
        ButtonLabelPortal: props.ButtonLabelPortal,
        checked: props.checked,
        disabled: props.disabled,
        name: props.name,
        value: props.value,
        variant: props.variant,
      }}
    >
      <li onClick={props.toggleIsOpen} className={cn(radioGroupItemVariants({ variant: props.variant }))}>
        <label className={cn(radioGroupLabelVariants({ variant: props.variant }))} tabIndex={0} htmlFor={id}>
          <div className="h-full w-full" ref={onLabelRef} />
          <input
            className="hidden appearance-none"
            role="option"
            aria-selected={props.checked}
            type="radio"
            id={id}
            name={props.name}
            value={props.value}
            checked={props.checked}
            disabled={props.disabled}
          />
        </label>
        {props.variant === 'vertical' && props.checked && <div className="w-full" ref={onExpandedContentRef} />}
        {props.children}
      </li>
    </OptionContext.Provider>
  );
}

type ExpenseRadioGroupProps<T> = {
  name: string;
  value: T;
  onChange: (e) => void;
  className?: string;
  children: React.ReactNode;
  variant?: Parameters<typeof radioGroupVariants>[0]['variant'];
};

export function ExpenseRadioGroup<T>(props: ExpenseRadioGroupProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);

  const [ButtonLabelPortal, setButtonLabelPortal] = React.useState<Portal>(() => () => null);
  const onButtonLabelRef = React.useCallback(ref => setButtonLabelPortal(() => createPortalComponent(ref)), []);

  const variant = props.variant || 'tab';

  const { onChange, name } = props;
  const onInputChange = React.useCallback(
    (e: BaseSyntheticEvent<Event, HTMLFieldSetElement, HTMLInputElement>) => {
      if (e.target.name === name) {
        setIsOpen(false);
        onChange(e);
      }
    },
    [onChange, name],
  );

  const isInline = true;

  return (
    <fieldset className={cn('relative', props.className)} onChange={onInputChange}>
      {variant === 'select' && (
        <button
          type="button"
          className={cn(
            'relative flex w-full items-center rounded-md border px-[48px] py-2 text-start text-sm font-medium before:absolute before:left-[16px] before:block before:h-4 before:w-4 before:rounded-full before:border before:border-[#1869F5] before:[box-shadow:0px_0px_0px_4px_#1869F5_inset]',
            {
              'rounded-b-none border-b-0': isOpen,
              'shadow [--tw-shadow:1px_0px_5px_rgb(0_0_0_/_0.1)]': isOpen && !isInline,
            },
          )}
          role="combobox"
          aria-controls={props.name}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={e => {
            if (['ArrowDown'].includes(e.key)) {
              setIsOpen(true);
            }
          }}
        >
          <div className="h-full w-full" ref={onButtonLabelRef} />
          <span className="absolute right-[16px]">
            <ChevronsUpDown size={16} />
          </span>
        </button>
      )}
      <ul
        id={props.name}
        className={cn(radioGroupVariants({ variant }), {
          hidden: variant === 'select' && !isOpen,
          'rounded-md rounded-t-none border border-t-0': variant === 'select' && isOpen,
          'absolute z-50 w-full bg-white shadow [--tw-shadow:1px_3px_5px_rgb(0_0_0_/_0.1)]':
            variant === 'select' && isOpen && !isInline,
        })}
        role="listbox"
      >
        {Children.map(props.children, option => {
          const optionProps = (option as any).props as OptionProps;
          return (
            <ExpenseRadioGroupItem
              ButtonLabelPortal={ButtonLabelPortal}
              key={optionProps.value}
              name={props.name}
              value={optionProps.value}
              disabled={optionProps.disabled}
              checked={optionProps.value === props.value}
              variant={variant}
              toggleIsOpen={() => setIsOpen(!isOpen)}
            >
              {option}
            </ExpenseRadioGroupItem>
          );
        })}
      </ul>
    </fieldset>
  );
}

type Portal = React.FC<React.PropsWithChildren>;

function createPortalComponent(elRef?: HTMLElement): Portal {
  return function Portal({ children }: React.PropsWithChildren) {
    return elRef && createPortal(children, elRef);
  };
}

export const OptionContext = React.createContext<{
  LabelPortal: Portal;
  ExpandedContentPortal: Portal;
  ButtonLabelPortal: Portal;
  checked: boolean;
  disabled: boolean;
  variant: string;
  name: string;
  value: string;
}>(null);

type OptionProps = {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
};

export function Label(props: React.PropsWithChildren) {
  const context = React.useContext(OptionContext);

  return (
    <React.Fragment>
      <context.LabelPortal>{props.children}</context.LabelPortal>
      {context.checked && <context.ButtonLabelPortal>{props.children}</context.ButtonLabelPortal>}
    </React.Fragment>
  );
}

export function ExpandedContent(props: React.PropsWithChildren) {
  const context = React.useContext(OptionContext);
  return <context.ExpandedContentPortal>{props.children}</context.ExpandedContentPortal>;
}

export function Option(props: OptionProps) {
  return <React.Fragment>{props.children}</React.Fragment>;
}
