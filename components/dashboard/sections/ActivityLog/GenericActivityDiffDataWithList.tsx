import React from 'react';
import PropTypes from 'prop-types';
import { diffArrays, diffChars, diffJson } from 'diff';
import { has, isEmpty, pickBy, startCase } from 'lodash';
import { Pencil } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Flex } from '../../../Grid';

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
    ...removedKeys.map(key => ({ action: 'remove', key, prevValue: JSON.stringify(prev[key]) })),
    ...addedKeys.map(key => ({ action: 'add', key, newValue: JSON.stringify(next[key]) })),
    ...Object.keys(changedValues).map(key => ({
      action: 'update',
      key,
      newValue: next[key],
      prevValue: prev[key],
      changes: diffValues(prev[key], next[key]),
    })),
  ];
};

const InlineDiffContainer = styled.div`
  background: ${props => props.theme.colors.black[100]};
  padding: 12px;
  border-radius: 8px;
`;

const InlineRemovedValue = styled.span`
  background-color: ${props => props.theme.colors.red[600]};
  color: white;
  text-decoration: line-through;
`;

const InlineAddedValue = styled.span`
  background: ${props => props.theme.colors.green[600]};
  color: white;
`;

const RemovedValue = styled.div`
  background-color: ${props => props.theme.colors.red[600]};
  color: white;
  text-decoration: line-through;
  display: block;
  padding: 4px;
  border-radius: 8px;
`;

const AddedValue = styled.div`
  background: ${props => props.theme.colors.green[600]};
  color: white;
  display: block;
  padding: 4px;
  border-radius: 8px;
`;

const shouldUseInlineDiff = changes => {
  const diffLength = changes?.diff?.length ?? 0;
  if (diffLength === 1 && (changes.diff[0].added || changes.diff[0].removed)) {
    return false; // When we only add or remove a value, it's clearer to just display old value / new value
  } else if (diffLength === 2 && changes.diff[0].removed && changes.diff[1].added) {
    return false; // When we completely replace the value, it's clearer to just display old value / new value
  } else if (diffLength > 15) {
    return false; // When there are too many changes, it's clearer to just display old value / new value
  } else {
    return true;
  }
};

const DEFAULT_IGNORED_FIELDS = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'CollectiveId'];
const ALWAYS_DISPLAYED = ['code'];

export const GenericActivityDiffDataWithList = ({ activity }) => {
  const { added, removed, edited } = activity.data ?? {};
  if (!added?.length && !removed?.length && !edited?.length) {
    return (
      <i>
        <FormattedMessage defaultMessage="No details to show" id="mr2kVW" />
      </i>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {Boolean(added?.length) && (
        <div className="flex">
          <div className="mr-2 w-[25px] rounded bg-green-100 p-2">
            <strong>+</strong>
          </div>
          <div className="flex w-full flex-col space-y-2">
            {added.map(item => (
              <div key={item.id} className="w-full flex-grow rounded bg-green-100 p-2">
                {Object.keys(item)
                  .filter(key => item[key] && !DEFAULT_IGNORED_FIELDS.includes(key))
                  .map(key => (
                    <div key={key}>
                      <b>{startCase(key)}</b>: {item[key]}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {Boolean(removed?.length) && (
        <div className="flex">
          <div className="mr-2 w-[25px] rounded bg-red-100 p-2">
            <strong>-</strong>
          </div>
          <div className="flex w-full flex-col space-y-2">
            {removed.map(item => (
              <div key={item.id} className="w-full flex-grow rounded bg-red-100 p-2">
                {Object.keys(item)
                  .filter(key => item[key] && !DEFAULT_IGNORED_FIELDS.includes(key))
                  .map(key => (
                    <div key={key}>
                      <b>{startCase(key)}</b>: {item[key]}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {Boolean(edited?.length) && (
        <div className="flex">
          <div className="mr-2 w-[25px] rounded bg-blue-100 p-2">
            <Pencil size={11} />
          </div>
          <div className="flex w-full flex-col space-y-2">
            {edited.map(({ previousData, newData }) => (
              <div key={previousData.id} className="w-full flex-grow rounded bg-blue-100 p-2">
                {ALWAYS_DISPLAYED.map(key => {
                  if (previousData[key] === newData[key]) {
                    return (
                      <div key={key}>
                        <b>{startCase(key)}</b>: {previousData[key]}
                      </div>
                    );
                  } else {
                    return null; // Will be taken care of by the diff below
                  }
                })}
                {deepCompare(previousData, newData).map((comparison, index) => {
                  const { action, key } = comparison;
                  if (DEFAULT_IGNORED_FIELDS.includes(key)) {
                    return null;
                  }

                  const changes = comparison['changes'] ?? {};
                  const prevValue = comparison['prevValue'] ?? previousData[key];
                  const newValue = comparison['newValue'] ?? newData[key];
                  const useInlineDiff = shouldUseInlineDiff(changes);
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={`${key}-${index}`}>
                      <b>{startCase(key)}</b>:
                      {action === 'remove' ? (
                        <InlineRemovedValue>{prevValue}</InlineRemovedValue>
                      ) : action === 'add' ? (
                        <InlineAddedValue>{newValue}</InlineAddedValue>
                      ) : action === 'update' ? (
                        <div>
                          {useInlineDiff ? (
                            <InlineDiffContainer>
                              {changes.diff.map((part, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <React.Fragment key={index}>
                                  {part.added ? (
                                    <InlineAddedValue>{part.value}</InlineAddedValue>
                                  ) : part.removed ? (
                                    <InlineRemovedValue>{part.value}</InlineRemovedValue>
                                  ) : (
                                    <span>{part.value}</span>
                                  )}
                                  {/* Separate array values (e.g. for tags) with commas */}
                                  {changes.type === 'array' && index < changes.diff.length - 1 && ', '}
                                  {/* For numbers & unknown types, show as "Previous value → New value" */}
                                  {changes.type === 'default' && index < changes.diff.length - 1 && ' → '}
                                </React.Fragment>
                              ))}
                            </InlineDiffContainer>
                          ) : (
                            <Flex flexDirection="column" gridGap="8px">
                              {!isEmpty(prevValue) && <RemovedValue>{JSON.stringify(prevValue, null, 2)}</RemovedValue>}
                              {!isEmpty(newValue) && <AddedValue>{JSON.stringify(newValue, null, 2)}</AddedValue>}
                            </Flex>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

GenericActivityDiffDataWithList.propTypes = {
  activity: PropTypes.shape({ type: PropTypes.string.isRequired, data: PropTypes.object }).isRequired,
};
