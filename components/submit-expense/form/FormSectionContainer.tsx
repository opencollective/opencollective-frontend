import React from 'react';
import { useInView } from 'react-intersection-observer';

type FormSectionContainerProps = {
  children: React.ReactNode;
  /** The step this section renders, used to scroll to it */
  id: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  hideTitle?: boolean;
  inViewChange: (inView: boolean, entry: IntersectionObserverEntry) => void;
};

/** A section of a multi-step form (Expense or Grant flows) */
export function FormSectionContainer(props: FormSectionContainerProps) {
  const { ref } = useInView({
    onChange: props.inViewChange,
    rootMargin: '-50px 0px -70% 0px',
  });

  return (
    <div ref={ref} id={props.id} className="scroll-m-8">
      <div className="rounded-lg border border-white bg-white p-4 sm:p-6">
        {!props.hideTitle && props.title && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0F1729]">{props.title}</h2>
            {props.subtitle && <div className="text-sm text-muted-foreground">{props.subtitle}</div>}
          </div>
        )}
        {props.children}
      </div>
    </div>
  );
}
