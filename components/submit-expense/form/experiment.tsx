import React from 'react';
import type { Path, PathValue } from 'dot-path-value';
import { get, set } from 'lodash';
import type { FormEvent, FormEventHandler } from 'react';
import z from 'zod';

type OnValueChangedListener<V> = (value: V) => void;
type FormContextValue<
  FormSchema extends z.AnyZodObject,
  FormValue = FormSchema['_output'],
  FormFieldNames extends Path<FormValue> = Path<FormValue>,
> = {
  formSchema: FormSchema;
  getValue: <T extends FormFieldNames>(name: T) => PathValue<FormValue, T>;
  setValue: <T extends FormFieldNames>(name: T, value: PathValue<FormValue, T>) => void;
  addValueListener: <T extends FormFieldNames>(
    name: T,
    onValueChangedListener: OnValueChangedListener<PathValue<FormValue, T>>,
  ) => void;
  removeValueListener: <T extends FormFieldNames>(
    name: T,
    onValueChangedListener: OnValueChangedListener<PathValue<FormValue, T>>,
  ) => void;
};

export class FormHandler<
  FormSchema extends z.AnyZodObject,
  FormFieldNames extends Path<FormSchema['_output']> = Path<FormSchema['_output']>,
> {
  _listeners: Partial<Record<FormFieldNames, OnValueChangedListener<any>[]>> = {};
  _values: FormSchema['_output'] = {};
  _defaultValues: Partial<FormSchema['_output']>;
  _formSchema: FormSchema;

  _changeListeners = [];

  constructor(formSchema: FormSchema, { defaultValues }: { defaultValues?: Partial<FormSchema['_output']> } = {}) {
    this._formSchema = formSchema;
    this._defaultValues = defaultValues || {};
  }

  get formSchema(): FormSchema {
    return this._formSchema;
  }

  addOnChangeListener(listener) {
    this._changeListeners = [...this._changeListeners, listener];
  }

  removeOnChangeListener(listener) {
    this._changeListeners = [...this._changeListeners.filter(a => a === listener)];
  }

  // return listeners attached to some prtion of the value
  getListenersForValue(name: FormFieldNames) {
    const listeners = Object.entries<OnValueChangedListener<any>[]>(this._listeners)
      .filter(
        ([listenerFieldName]) =>
          name !== listenerFieldName && (listenerFieldName.startsWith(name) || name.startsWith(listenerFieldName)),
      )
      .flatMap(([listenerFieldName, listeners]) =>
        listeners.map(listener => () => {
          listener(get(this._values, listenerFieldName));
        }),
      );

    return [...this._listeners[name], ...listeners];
  }

  getValues() {
    return this._values;
  }

  getValue<T extends FormFieldNames>(name: T): PathValue<FormSchema['_output'], T> {
    return get(this._values, name) || get(this._defaultValues, name);
  }

  setValue<T extends FormFieldNames>(name: T, value: PathValue<FormSchema['_output'], T>) {
    set(this._values, name, value);
    const valueListeners = this.getListenersForValue(name);
    for (const listener of valueListeners) {
      listener(value);
    }
    for (const listener of this._changeListeners) {
      listener(this, name, value);
    }
  }

  addValueListener<T extends FormFieldNames>(
    name: T,
    listener: OnValueChangedListener<PathValue<FormSchema['_output'], T>>,
  ) {
    const valueListeners = this._listeners[name] || [];
    if (valueListeners.includes(listener)) {
      return;
    }

    this._listeners[name] = [...valueListeners, listener];
  }

  removeValueListener<T extends FormFieldNames>(
    name: T,
    listener: OnValueChangedListener<PathValue<FormSchema['_output'], T>>,
  ) {
    const valueListeners = this._listeners[name] || [];
    this._listeners[name] = [...valueListeners.filter(a => a === listener)];
  }
}

export const FormContext = React.createContext(null);

export function useFormContext<FormSchema extends z.AnyZodObject>(): FormContextValue<FormSchema> {
  return React.useContext<FormContextValue<FormSchema>>(FormContext);
}

export enum InviteeAccountType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
}

export enum WhoIsPayingOption {
  LAST_SUBMITTED = 'LAST_SUBMITTED',
  RECENT = 'RECENT',
  SEARCH = 'SEARCH',
}

export enum WhoIsGettingPaidOption {
  MY_PROFILES = 'MY_PROFILES',
  INVITEE = 'INVITEE',
  VENDOR = 'VENDOR',
}

export enum InviteeOption {
  NEW_USER = 'NEW_USER',
  EXISTING = 'EXISTING',
}

export enum PayoutMethodOption {
  NEW_PAYOUT_METHOD = 'NEW_PAYOUT_METHOD',
  EXISTING_PAYOUT_METHOD = 'EXISTING_PAYOUT_METHOD',
}

export const ExpenseFormSchema = z.object({
  whoIsPayingOption: z.nativeEnum(WhoIsPayingOption),
  lastExpenseAccountSlug: z.string(),
  recentExpenseAccount: z.string(),
  searchExpenseAccount: z.string(),

  whoIsGettingPaidOption: z.nativeEnum(WhoIsGettingPaidOption),
  myProfilesExpensePayeePick: z.string(),
  inviteeOption: z.nativeEnum(InviteeOption),

  inviteeAccountType: z.nativeEnum(InviteeAccountType),
  inviteeExistingAccount: z.string(),

  inviteeNewIndividual: z.object({
    contactName: z.string(),
    emailAddress: z.string().email(),
    notes: z.string(),
  }),

  inviteeNewOrganization: z.object({
    name: z.string(),
    slug: z.string(),
    website: z.string(),
    description: z.string(),
    contactName: z.string(),
    emailAddress: z.string().email(),
    notes: z.string(),
  }),

  vendorExpensePayeeAccount: z.string(),

  expenseTypeOption: z.string(),

  expenseItems: z.array(
    z.object({
      formId: z.number(),
      description: z.string(),
      date: z.string(),
      amount: z.number(),
      currency: z.string(),
      attachment: z.union([z.string(), z.instanceof(File)]),
    }),
  ),

  additionalAttachments: z.array(z.instanceof(File)),
});

type UseFormFieldHook<FormSchema extends z.AnyZodObject, FormFieldName extends Path<FormSchema['_output']>> = {
  onChange: FormEventHandler;
  formSchema: FormSchema;
  name: FormFieldName;
  value: PathValue<FormSchema['_output'], FormFieldName>;
  setValue: (value: PathValue<FormSchema['_output'], FormFieldName>) => void;
};

const makeTypedUseFormField = function <FormSchema extends z.AnyZodObject>(): <
  FormFieldName extends Path<FormSchema['_output']>,
>(
  name: FormFieldName,
) => UseFormFieldHook<FormSchema, FormFieldName> {
  return useFormField;
};

const makeTypedUseFormValue = function <FormSchema extends z.AnyZodObject>(): <
  FormFieldName extends Path<FormSchema['_output']>,
>(
  name: FormFieldName,
) => UseFormValueHook<FormSchema, FormFieldName> {
  return useFormValue;
};

export const useExpenseFormField = makeTypedUseFormField<typeof ExpenseFormSchema>();
export const useExpenseFormValue = makeTypedUseFormValue<typeof ExpenseFormSchema>();

export function useFormField<FormSchema extends z.AnyZodObject, K extends Path<FormSchema['_output']>>(
  name: K,
): UseFormFieldHook<FormSchema, K> {
  const context = useFormContext<FormSchema>();
  // const [value, setValue] = React.useState(context.getValue(name));

  const subscribe = React.useCallback(
    callback => {
      const ctx = context;
      const fieldName = name;
      ctx.addValueListener(fieldName, callback);
      return () => ctx.removeValueListener(fieldName, callback);
    },
    [context, name],
  );

  const getSnapshot = React.useCallback(() => {
    const ctx = context;
    const fieldName = name;
    return ctx.getValue(fieldName);
  }, [context, name]);

  const value = React.useSyncExternalStore(subscribe, getSnapshot);

  // React.useEffect(() => {
  //   const fieldName = name;
  //   function onValueChanged(newValue: PathValue<FormSchema['_output'], K>) {
  //     console.log(`onValueChange(${fieldName}, ${newValue})`);
  //     if (Array.isArray(newValue)) {
  //       setValue([...newValue] as PathValue<FormSchema['_output'], K>);
  //     } else {
  //       setValue(newValue);
  //     }
  //   }
  //   setValue(() => context.getValue(fieldName));
  //   context.addValueListener<K>(fieldName, onValueChanged);
  //   console.log(`register listener ${fieldName}`);
  //   return () => {
  //     console.log(`removing listener ${fieldName}`);
  //     context.removeValueListener(fieldName, onValueChanged);
  //   };
  // }, [name, context]);

  const setValueCallback = React.useCallback(
    (value: PathValue<FormSchema['_output'], K>) => {
      // setValue(value);
      context.setValue(name, value);
    },
    [name, context],
  );

  const onChange = React.useCallback(
    (e: FormEvent) => {
      setValueCallback(e.target['value']);
    },
    [setValueCallback],
  );

  return React.useMemo(
    () => ({
      onChange,
      formSchema: context.formSchema,
      name,
      value,
      setValue: setValueCallback,
    }),
    [name, value, setValueCallback, onChange, context],
  );
}

type UseFormValueHook<FormSchema extends z.AnyZodObject, K extends Path<FormSchema['_output']>> = [
  PathValue<FormSchema['_output'], K>,
  (v: PathValue<FormSchema['_output'], K>) => void,
];

export function useFormValue<FormSchema extends z.AnyZodObject, K extends Path<FormSchema['_output']>>(
  name: K,
): UseFormValueHook<FormSchema, K> {
  const field = useFormField<FormSchema, K>(name);
  return [field.value, field.setValue];
}
