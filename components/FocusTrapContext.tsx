import React from 'react';
import FocusTrap from 'focus-trap-react';
import { uniq } from 'lodash';

/**
 * To make sure `FocusTrap` catches all events for the nodes under it, we need to manually register
 * those that are rendered outside of the tree, with React portals. This context is meant to
 */
export const FocusTrapContext = React.createContext<{
  registerRef: (ref: React.RefObject<HTMLElement>) => void;
  unregisterRef: (ref: React.RefObject<HTMLElement>) => void;
  clearAll: () => void;
  refs: Array<HTMLElement>;
}>(null);

export const FocusTrapWithContext = ({ containerElements, ...props }: FocusTrap.Props) => {
  const [refs, setRefs] = React.useState([]);
  const registeredElements = refs.map(ref => ref.current).filter(Boolean);
  return (
    <FocusTrapContext.Provider
      value={{
        refs,
        registerRef: node => setRefs(uniq([...refs, node])),
        unregisterRef: node => setRefs(refs.filter(registeredNode => registeredNode !== node)),
        clearAll: () => setRefs([]),
      }}
    >
      <FocusTrap {...props} containerElements={[...registeredElements, ...(containerElements || [])]} />
    </FocusTrapContext.Provider>
  );
};
