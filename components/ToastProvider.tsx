import React, { ReactNode, useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuid } from 'uuid';

export enum TOAST_TYPE {
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  INFO = 'INFO',
}

type Toast = {
  id: string;
  type: TOAST_TYPE;
  variant: 'light' | 'dark';
  message: ReactNode | null;
  title: ReactNode | null;
  duration: number;
};

type ToastInput = Partial<Toast>;

type ToastFilterFunc = (toast: Toast) => boolean;

interface ToastContextInterface {
  toasts: Toast[];
  addToast(toast: ToastInput): void;
  addToasts(toasts: Array<ToastInput>): void;
  removeToasts(filter: ToastFilterFunc): void;
}

export const ToastContext = React.createContext<ToastContextInterface>(null);

const createToast = (params: ToastInput) => {
  return {
    ...params,
    id: uuid(),
    type: params.type || TOAST_TYPE.INFO,
    createdAt: Date.now(),
  };
};

/**
 * A global state to store toast notifications that are persisted across the app
 */
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const context = {
    toasts,
    /** Use this helper to add multiple toasts at once */
    addToasts: useCallback(toastsParams => setToasts([...toasts, ...toastsParams.map(createToast)]), [toasts]),
    /** To add a single toast */
    addToast: useCallback(params => setToasts([...toasts, createToast(params)]), [toasts]),
    /** To remove displayed toasts */
    removeToasts: useCallback(
      filterFunc => {
        const newToasts = toasts.filter(toast => !filterFunc(toast));
        if (newToasts.length !== toasts.length) {
          setToasts(newToasts);
        }
      },
      [toasts],
    ),
  };

  return <ToastContext.Provider value={context}>{children}</ToastContext.Provider>;
};

ToastProvider.propTypes = {
  children: PropTypes.node,
};

/**
 * An helper to use the toasts provider with hooks
 */
export const useToasts = () => {
  return useContext(ToastContext);
};

export const withToasts = WrappedComponent => {
  const WithToasts = props => (
    <ToastContext.Consumer>{context => <WrappedComponent {...context} {...props} />}</ToastContext.Consumer>
  );

  WithToasts.getInitialProps = WrappedComponent.getInitialProps;
  return WithToasts;
};

export default ToastProvider;
