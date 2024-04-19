import React, { useReducer, createContext, useContext } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/AlertDialog';
import ConfirmationModal from './ConfirmationModal';

interface ModalContextValues {
  component: React.FC;
  modalProps: any;
  showModal: (component: React.ComponentType<any>, modalProps?: any) => void;
  showConfirmationModal: (modalProps?: any) => void;
  hideModal: () => void;
}

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const ModalContext = createContext<ModalContextValues>({
  component: () => <div>No modal component supplied</div>,
  modalProps: {},
  showModal: () => undefined,
  showConfirmationModal: () => undefined,
  hideModal: () => undefined,
});

const { Provider, Consumer: ModalConsumer } = ModalContext;

const reducer = (
  state,
  {
    type,
    component,
    modalProps,
    modalType,
    id,
    onCloseFocusRef,
  }: { type: string; component?: React.FC; modalProps?: any },
) => {
  switch (type) {
    case 'openModal':
      console.log('openModal', component, modalProps, modalType);
      return {
        ...state,
        openModals: [
          ...state.openModals,
          { open: true, component, modalProps, id: genId(), modalType, onCloseFocusRef },
        ],
      };
    case 'hideModal':
      return {
        ...state,
        openModals: state.openModals.map(m => ({
          ...m,
          open: m.id === id ? false : m.open,
        })),
      };
    default:
      throw new Error('Unspecified reducer action');
  }
};

export type CloseComponentType = React.ComponentType<{
  onClick: React.MouseEventHandler<any>;
}>;

export type ContentComponentType = React.ComponentType<{
  className?: string;
  children: React.ReactNode;
}>;

export type ModalProviderProps = {
  children: React.ReactNode;
  CloseComponent?: CloseComponentType;
  ContentComponent?: ContentComponentType;
};

const ModalRoot = () => {
  const { openModals, component: Component, modalProps, hideModal, showModal } = useModal();
  console.log('openModals', openModals);
  return openModals.map(({ component: Component, modalProps, modalType, id, open, onCloseFocusRef }) => {
    const onCloseAutoFocus = e => {
      console.log('in onCloseAutoFocus');
      if (onCloseFocusRef) {
        console.log('focusing onCloseFocusRef', onCloseFocusRef.current);
        e.preventDefault();
        onCloseFocusRef.current.focus();
      }
    };
    console.log('onCloseAutoFocus', onCloseAutoFocus);
    if (modalType === 'CONFIRMATION') {
      return (
        <ConfirmationModal
          key={id}
          open={open}
          setOpen={open => (!open ? hideModal(id) : null)}
          onCloseAutoFocus={onCloseAutoFocus}
          {...modalProps}
        />
      );
    }
    return (
      <Component
        key={id}
        {...modalProps}
        open={open}
        setOpen={open => {
          if (!open) {
            hideModal(id);
            modalProps.onClose?.();
          }
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    );
  });
};

const ModalProvider = ({ children }: ModalProviderProps) => {
  const initialState = {
    // component: null,
    // modalProps: {},
    openModals: [],
    showModal: (component, modalProps = {}, onCloseFocusRef) => {
      dispatch({ type: 'openModal', component, modalProps, onCloseFocusRef });
    },
    showConfirmationModal: (modalProps = {}, onCloseFocusRef) => {
      console.log('showConfirmationModal');
      dispatch({ type: 'openModal', modalProps, modalType: 'CONFIRMATION' });
    },
    hideModal: id => {
      dispatch({ type: 'hideModal', id });
    },
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  //   useEffect(() => {
  //     state.component === null
  //       ? document.addEventListener('keydown', onKeyDown)
  //       : document.removeEventListener('keydown', onKeyDown);
  //   }, [state.component]);

  return (
    <Provider value={state}>
      <ModalRoot />
      {children}
    </Provider>
  );
};

const useModal = () => useContext(ModalContext);

export { ModalConsumer, ModalProvider, useModal };
