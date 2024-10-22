import React from 'react';
import { useInView } from 'react-intersection-observer';

type FormSectionContainerProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  id: string;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

export function FormSectionContainer(props: FormSectionContainerProps) {
  const { ref } = useInView({
    onChange: props.inViewChange,
    rootMargin: '-50px 0px -70% 0px',
  });

  return (
    <div ref={ref} id={props.id} className="rounded-lg bg-white p-6">
      <div className="mb-4 space-y-2">
        <div className="text-xl font-bold">{props.title}</div>
        {props.subtitle && <div className="text-sm text-muted-foreground">{props.subtitle}</div>}
      </div>
      {props.children}
    </div>
  );
}
