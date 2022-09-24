import React from 'react';
import PropTypes from 'prop-types';
import { diffArrays, diffChars, diffJson } from 'diff';
import { has, isEmpty, pickBy, startCase } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

const diffValues = (prevValue, newValue) => {
  if (typeof prevValue === 'string' || typeof newValue === 'string') {
    return { type: 'string', diff: diffChars(prevValue ?? '', newValue ?? '') };
  } else if (Array.isArray(prevValue) || Array.isArray(newValue)) {
    return { type: 'array', diff: diffArrays(prevValue ?? [], newValue ?? []) };
  } else if (typeof prevValue === 'object' || typeof newValue === 'object') {
    return { type: 'object', diff: diffJson(prevValue ?? {}, newValue ?? {}) };
  } else {
    return {
      type: 'default',
      diff: [
        { removed: true, value: JSON.stringify(prevValue) },
        { added: true, value: JSON.stringify(newValue) },
      ],
    };
  }
};

const deepCompare = (prev, next) => {
  const removedKeys = Object.keys(prev).filter(key => !has(next, key));
  const addedKeys = Object.keys(next).filter(key => !has(prev, key));
  const changedValues = pickBy(next, (value, key) => !addedKeys.includes(key) && prev[key] !== value);
  return [
    ...removedKeys.map(key => ({ action: 'remove', key, prevValue: prev[key] })),
    ...addedKeys.map(key => ({ action: 'add', key, newValue: next[key] })),
    ...Object.keys(changedValues).map(key => ({
      action: 'update',
      key,
      newValue: next[key],
      prevValue: prev[key],
      changes: diffValues(prev[key], next[key]),
    })),
  ];
};

const DiffLine = styled.div`
  display: flex;
  margin: 8px 0;
`;

const RemovedValue = styled.span`
  background-color: #8b0000;
  text-decoration: line-through;
  opacity: 0.45;
`;

const AddedValue = styled.span`
  background: #006330;
`;

const DiffedKey = styled.span`
  font-weight: bold;
  color: orange;
  min-width: 100px;
  margin-right: 8px;
  display: block;
`;

export const CollectiveEditedDetails = ({ activity }) => {
  const { newData, previousData } = activity.data ?? {};
  const fullDiff = React.useMemo(() => deepCompare(previousData, newData), [newData, previousData]);

  if (!fullDiff.length || (isEmpty(newData) && isEmpty(previousData))) {
    return (
      <i>
        <FormattedMessage defaultMessage="No details to show" />
      </i>
    );
  }

  return fullDiff.map(({ action, key, changes, newValue, prevValue }, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <DiffLine key={index}>
      <DiffedKey>{startCase(key)}</DiffedKey>
      {action === 'remove' ? (
        <RemovedValue>{prevValue}</RemovedValue>
      ) : action === 'add' ? (
        <AddedValue>{newValue}</AddedValue>
      ) : action === 'update' ? (
        <div>
          {changes.diff.map((part, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <React.Fragment key={index}>
              {part.added ? (
                <AddedValue>{part.value}</AddedValue>
              ) : part.removed ? (
                <RemovedValue>{part.value}</RemovedValue>
              ) : (
                <span>{part.value}</span>
              )}
              {/* Separate array values (e.g. for tags) with commas */}
              {changes.type === 'array' && index < changes.diff.length - 1 && ', '}
              {/* For for numbers & unknown types, show as "Previous value → New value" */}
              {changes.type === 'default' && index < changes.diff.length - 1 && ' → '}
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </DiffLine>
  ));
};

CollectiveEditedDetails.propTypes = {
  activity: PropTypes.shape({ type: PropTypes.string.isRequired, data: PropTypes.object }).isRequired,
};
