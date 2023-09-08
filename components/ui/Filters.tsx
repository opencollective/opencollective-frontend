import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { omit } from 'lodash';
import { Check, Filter, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { elementFromClass } from '../../lib/react-utils';

type FiltersProps = {
  options: Record<
    string,
    {
      label: string | React.ReactNode;
      options: Array<
        | {
            label: string | React.ReactNode;
            value: string;
          }
        | string
      >;
    }
  >;
  onChange: (key: string, value: string) => void;
  values?: Record<string, string>;
};

const Item = elementFromClass(
  DropdownMenu.Item,
  'inline-flex h-[25px] cursor-pointer items-center gap-1 rounded-md bg-white px-2 py-1.5 text-sm outline-none hover:bg-gray-50',
);

const FilterTag = elementFromClass(
  'div',
  'inline-flex h-8 items-center justify-center rounded-full border bg-white px-4 py-2 text-sm leading-none outline-none hover:bg-gray-50 data-[disabled]:bg-white data-[disabled]:opacity-50 cursor-pointer',
);

const Content = elementFromClass(
  DropdownMenu.Content,
  'bg-popover text-popover-foreground overflow-x-hidden1 mt-1 flex h-full max-h-[300px] w-full min-w-[220px] flex-col overflow-hidden overflow-y-auto rounded-md border bg-white p-1 shadow-md',
);

const Filters = (props: FiltersProps) => {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<Record<string, string>>(props.values || {});

  const getOptions = React.useCallback(
    (key, selectedValue?) =>
      props.options[key].options.map(option => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        return (
          <Item
            key={`${key}.${value}`}
            onSelect={() => {
              setValues({ ...values, [key]: value });
              props.onChange(key, value);
              setSelected(null);
            }}
          >
            {selectedValue && (selectedValue === value ? <Check size="14px" /> : <div className="w-[14px]" />)}
            {label}
          </Item>
        );
      }),
    [props.options],
  );

  const missingFilters = Object.keys(props.options).filter(key => !values[key]);
  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(values || {})
        .filter(key => !!props.options[key])
        .map(key => {
          const filter = props.options[key];
          const option = filter.options.find(o => (typeof o === 'string' ? o : o.value) === values[key]);
          const label = typeof option === 'string' ? option : option.label;
          const value = typeof option === 'string' ? option : option.value;
          return (
            <DropdownMenu.Root key={key}>
              <FilterTag>
                <DropdownMenu.Trigger>
                  <span className="text-gray-500">
                    <FormattedMessage
                      defaultMessage="{label} is"
                      values={{
                        label: filter.label as string,
                      }}
                    />
                  </span>
                  &nbsp;
                  <span className="font-semibold">{label}</span>
                </DropdownMenu.Trigger>
                <button
                  onClick={() => {
                    setValues(omit(values, key));
                    props.onChange(key, null);
                  }}
                  className="ml-1 text-gray-500 hover:text-black"
                >
                  <X size="16px" />
                </button>
              </FilterTag>
              <DropdownMenu.Portal>
                <Content align="start">{getOptions(key, value)}</Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          );
        })}
      <DropdownMenu.Root
        onOpenChange={open => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <DropdownMenu.Trigger asChild disabled={missingFilters.length === 0}>
          <FilterTag aria-label="Add Filter">
            {selected ? (
              <span className="text-gray-500">
                <FormattedMessage
                  defaultMessage="{label} is"
                  values={{
                    label: props.options[selected].label as string,
                  }}
                />
              </span>
            ) : (
              <React.Fragment>
                <Filter size="16px" />
                &nbsp; Add Filter
              </React.Fragment>
            )}
          </FilterTag>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <Content align="start">
            {selected
              ? getOptions(selected)
              : missingFilters.map(key => (
                  <Item
                    key={key}
                    onSelect={e => {
                      e.preventDefault();
                      setSelected(key);
                    }}
                  >
                    {props.options[key].label}
                  </Item>
                ))}
          </Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export default Filters;
