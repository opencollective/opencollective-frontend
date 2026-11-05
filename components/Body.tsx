import React from 'react';

type Props = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default class Body extends React.Component<Props> {
  render() {
    const { children } = this.props;
    return (
      <main {...({ css: { minHeight: 'calc(100vh - 530px)' } } as React.HTMLAttributes<HTMLElement>)} {...this.props}>
        {children}
      </main>
    );
  }
}
