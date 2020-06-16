import React, { useRef } from 'react';
import { createDndContext, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const RNDContext = createDndContext(HTML5Backend);

const useDNDProviderElement = props => {
  const manager = useRef(RNDContext);
  return <DndProvider manager={manager.current.dragDropManager} {...props} />;
};

/**
 * Binds HTML5 DnD provider context.
 *
 * Implemented as a singleton to prevent the `Cannot have two HTML5 backends at the same time` issue.
 *
 * See https://github.com/react-dnd/react-dnd/issues/186
 */
export default function DndProviderHTML5Backend(props) {
  const DNDElement = useDNDProviderElement(props);
  return <React.Fragment>{DNDElement}</React.Fragment>;
}
