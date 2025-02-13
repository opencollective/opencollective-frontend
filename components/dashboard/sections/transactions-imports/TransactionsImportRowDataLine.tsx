import React from 'react';
import { isEmpty, startCase } from 'lodash';
import { ExternalLink } from 'lucide-react';
import { isURL } from 'validator';

import Link from '../../../Link';

const TransactionsImportRowDataLineValue = ({ value, level }) => {
  if (Array.isArray(value)) {
    if (value.length === 1) {
      return <TransactionsImportRowDataLineValue value={value[0]} level={level} />;
    } else if (value.every(item => typeof item === 'string')) {
      return <span>{value.join(', ')}</span>;
    } else {
      return (
        <ul className="list-inside list-disc pl-4">
          {value.map((item, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={index}>
              <strong>{index}:</strong> <TransactionsImportRowDataLineValue value={item} level={level + 1} />
            </li>
          ))}
        </ul>
      );
    }
  } else if (typeof value === 'object' && value !== null) {
    return (
      <ul className="list-inside list-disc pl-4">
        {Object.entries(value).map(([key, value]) => (
          <TransactionsImportRowDataLine key={key} value={value} labelKey={key} level={level + 1} />
        ))}
      </ul>
    );
  } else if (
    typeof value === 'string' &&
    value &&
    isURL(value, { protocols: ['http', 'https'], require_protocol: true })
  ) {
    return (
      <Link
        openInNewTab
        href={`/external-redirect?${new URLSearchParams({ url: value }).toString()}`}
        className="underline"
      >
        {value}&nbsp;
        <ExternalLink size="1em" className="mr-1 inline-block" />
      </Link>
    );
  } else {
    return <span>{value?.toString()}</span>;
  }
};

/**
 * Recursively filter empty values from `value`
 */
const filterEmptyValues = value => {
  if (Array.isArray(value)) {
    const filtered = value.map(filterEmptyValues).filter(Boolean);
    if (filtered.length === 0) {
      return null;
    }
  } else if (typeof value === 'object' && value !== null) {
    const cleanObject = Object.fromEntries(
      Object.entries(value)
        .map(([key, value]) => [key, filterEmptyValues(value)])
        .filter(([, value]) => !isEmpty(value)),
    );

    return isEmpty(cleanObject) ? null : cleanObject;
  }

  return value;
};

const checkIfKeyIsUnwanted = (key: string) => {
  return ['personal_finance_category_icon_url', 'personal_finance_category_icon_url'].includes(key);
};

export const TransactionsImportRowDataLine = ({ value, labelKey, level = 0 }) => {
  const isUnwanted = React.useMemo(() => checkIfKeyIsUnwanted(labelKey), [labelKey]);
  const cleanValue = React.useMemo(() => filterEmptyValues(value), [value]);
  if (isUnwanted || !cleanValue) {
    return null;
  }

  return (
    <li>
      <strong>{startCase(labelKey)}: </strong>
      <TransactionsImportRowDataLineValue value={cleanValue} level={level} />
    </li>
  );
};
