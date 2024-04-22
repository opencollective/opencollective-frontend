import React, { useReducer, createContext, useContext } from 'react';
import { Dialog, DialogContent } from './ui/Dialog';
import { AlertDialog, AlertDialogContent } from './ui/AlertDialog';

interface ModalContextValues {
  component: React.FC;
  modalProps: any;
  showModal: (component: React.ComponentType<any>, modalProps?: any) => void;
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
  hideModal: () => undefined,
});

const { Provider, Consumer: ModalConsumer } = ModalContext;

const reducer = (
  state,
  { type, component, modalProps, modalType }: { type: string; component?: React.FC; modalProps?: any },
) => {
  switch (type) {
    case 'openModal':
      return { ...state, openModals: [...state.openModals, { component, modalProps, id: genId(), modalType }] };
    case 'hideModal':
      return { ...state, openModals: state.openModals.slice(0, -1) };
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

  return openModals.map(({ component: Component, modalProps, modalType, id }) => {
    if (modalType === 'ALERT') {
      return (
        <AlertDialog key={id} open={true} onOpenChange={open => (!open ? hideModal() : null)}>
          <AlertDialogContent className={modalProps.className}>
            <Component {...modalProps} hideModal={hideModal} showModal={showModal} />
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    return (
      <Dialog key={id} open={true} onOpenChange={open => (!open ? hideModal() : null)}>
        <DialogContent className={modalProps.className}>
          <Component {...modalProps} hideModal={hideModal} showModal={showModal} />
        </DialogContent>
      </Dialog>
    );
  });
};

const ModalProvider = ({ children }: ModalProviderProps) => {
  const initialState = {
    // component: null,
    // modalProps: {},
    openModals: [],
    showModal: (component, modalProps = {}, modalType = 'DIALOG') => {
      dispatch({ type: 'openModal', component, modalProps, modalType });
    },
    hideModal: () => {
      dispatch({ type: 'hideModal' });
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
